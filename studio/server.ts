import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { validateCatalog, contentIssues } from '../lib/content';

export function studioPlugin(root = process.cwd()): Plugin {
  const contentFile = path.join(root, 'content/states.json');
  const draftFile = path.join(root, '.studio/draft.json');
  const token = randomBytes(32).toString('hex');
  let busy = false;
  const read = async () => {
    const published = await readFile(contentFile, 'utf8');
    let draft = '';
    try {
      draft = await readFile(draftFile, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
    const revision = createHash('sha256')
      .update(published + '\0' + draft)
      .digest('hex');
    return {
      catalog: validateCatalog(JSON.parse(draft || published)),
      savedDraft: !!draft,
      revision,
    };
  };
  const atomic = async (file: string, data: string) => {
    await mkdir(path.dirname(file), { recursive: true });
    const temp = file + '.' + randomUUID() + '.tmp';
    await writeFile(temp, data, 'utf8');
    await rename(temp, file);
  };
  const reply = (res: ServerResponse, status: number, value: unknown) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(value));
  };
  const body = async (req: IncomingMessage, limit: number) => {
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > limit) throw new Error('ไฟล์ใหญ่เกินกำหนด');
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  };
  async function handler(req: IncomingMessage, res: ServerResponse) {
    const host = req.headers.host || '';
    if (
      !/^(127\.0\.0\.1|localhost):\d+$/.test(host) ||
      (req.headers.origin && req.headers.origin !== `http://${host}`) ||
      req.headers['sec-fetch-site'] === 'cross-site'
    ) {
      reply(res, 403, { error: 'Local same-origin access only' });
      return;
    }
    if (req.method === 'GET' && req.url === '/api/studio') {
      reply(res, 200, { ...(await read()), token });
      return;
    }
    if (req.headers['x-studio-token'] !== token) {
      reply(res, 403, { error: 'Invalid studio session' });
      return;
    }
    if (busy) {
      reply(res, 409, { error: 'กำลังบันทึก กรุณาลองอีกครั้ง' });
      return;
    }
    busy = true;
    try {
      if (req.method === 'POST' && req.url === '/api/studio/upload') {
        const bytes = await body(req, 5_000_000);
        let ext = '';
        if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ext = 'jpg';
        else if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
          ext = 'png';
        else if (
          bytes.toString('ascii', 0, 4) === 'RIFF' &&
          bytes.toString('ascii', 8, 12) === 'WEBP'
        )
          ext = 'webp';
        if (!ext) throw new Error('รองรับเฉพาะภาพ JPEG, PNG และ WebP');
        const src = `/images/library/${randomUUID()}.${ext}`;
        await mkdir(path.join(root, 'public/images/library'), { recursive: true });
        await writeFile(path.join(root, 'public' + src), bytes);
        reply(res, 201, { src });
        return;
      }
      const data = JSON.parse((await body(req, 2_000_000)).toString('utf8'));
      const current = await read();
      if (data.revision !== current.revision) {
        reply(res, 409, { error: 'เนื้อหาถูกแก้ไขจากหน้าต่างอื่น กรุณาโหลดข้อมูลล่าสุด' });
        return;
      }
      if (req.method === 'PUT' && req.url === '/api/studio/draft') {
        const catalog = validateCatalog(data.catalog);
        await atomic(draftFile, JSON.stringify(catalog, null, 2) + '\n');
        reply(res, 200, { ...(await read()), token });
        return;
      }
      if (req.method === 'POST' && req.url === '/api/studio/publish') {
        const catalog = validateCatalog(data.catalog);
        const issues = contentIssues(catalog);
        for (const state of catalog.states)
          for (const photo of state.photos) {
            try {
              const info = await stat(path.join(root, 'public' + photo.src));
              if (!info.isFile() || info.size < 100) throw Error();
            } catch {
              issues.push({
                code: state.code,
                field: 'photos',
                message: 'ไม่พบไฟล์ภาพ ' + photo.src,
              });
            }
          }
        if (issues.length) {
          reply(res, 422, { error: 'ยังเผยแพร่ไม่ได้: ข้อมูลไม่ครบ', issues });
          return;
        }
        await atomic(contentFile, JSON.stringify(catalog, null, 2) + '\n');
        // Keep a draft matching the published content; never erase an unrelated owner draft.
        await atomic(draftFile, JSON.stringify(catalog, null, 2) + '\n');
        reply(res, 200, { ...(await read()), token });
        return;
      }
      reply(res, 404, { error: 'Unknown studio action' });
    } finally {
      busy = false;
    }
  }
  return {
    name: 'roam-local-content-studio',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/studio')) {
          next();
          return;
        }
        void handler(req, res).catch((e) =>
          reply(res, 400, { error: e instanceof Error ? e.message : 'Unable to update content' }),
        );
      });
    },
  };
}
