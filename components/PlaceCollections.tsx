import TravelImage from './TravelImage';
import { useRef, useState } from 'react';
import type { Language, StateGuide } from '../data/travel';
import { local } from '../data/travel';
import { x } from '../data/experience-copy';
import { findPlace } from '../lib/destinations';
import { downloadFile } from '../lib/storage';
import {
  validateCollections,
  type PlaceCollections as Collections,
  type Collections as CollectionData,
} from '../lib/collections';
export default function PlaceCollections({
  collections,
  lang,
  onOpen,
}: {
  collections: Collections;
  lang: Language;
  onOpen: (state: StateGuide, index: number) => void;
}) {
  const [group, setGroup] = useState('someday');
  const [name, setName] = useState('');
  const [pending, setPending] = useState<CollectionData | null>(null);
  const [importError, setImportError] = useState(false);
  const [removeGroup, setRemoveGroup] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const current = collections.groups.find((g) => g.id === group) ?? collections.groups[0];
  return (
    <section className="place-collections">
      <h3>{x(lang, 'collection')}</h3>
      <p>{x(lang, 'localOnly')}</p>
      {collections.error && <p role="alert">{x(lang, 'storageError')}</p>}
      <div className="collection-toolbar">
        <label>
          {x(lang, 'collectionName')}
          <select
            value={current.id}
            onChange={(e) => {
              setGroup(e.target.value);
              setRemoveGroup(false);
            }}
          >
            {collections.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name || x(lang, 'someday')} ({g.places.length})
              </option>
            ))}
          </select>
        </label>
        <button
          className="text-link"
          onClick={() =>
            downloadFile(
              'roam-collections.json',
              JSON.stringify(
                { version: 1, groups: collections.groups, visited: collections.visited },
                null,
                2,
              ),
              'application/json',
            )
          }
        >
          {x(lang, 'backup')}
        </button>
        <button className="text-link" onClick={() => file.current?.click()}>
          {local(
            [
              'Import collections',
              'นำเข้าชุดสถานที่',
              '导入收藏夹',
              'コレクションを読み込む',
              '컬렉션 가져오기',
            ],
            lang,
          )}
        </button>
        {current.id !== 'someday' && (
          <button className="text-link" onClick={() => setRemoveGroup(true)}>
            {x(lang, 'remove')}
          </button>
        )}
        <input
          ref={file}
          type="file"
          hidden
          accept="application/json,.json"
          aria-label={x(lang, 'collection')}
          onChange={async (e) => {
            const selected = e.target.files?.[0];
            e.target.value = '';
            if (!selected) return;
            setImportError(false);
            try {
              if (selected.size > 1000000) throw Error();
              const data = JSON.parse(await selected.text());
              if (data.version !== 1) throw Error();
              setPending(validateCollections(data));
            } catch {
              setImportError(true);
            }
          }}
        />
      </div>
      {importError && (
        <p role="alert">
          {local(
            [
              'Choose a valid Roam collections JSON backup under 1 MB.',
              'เลือกไฟล์สำรองชุดสถานที่ JSON ของ Roam ที่ถูกต้องและขนาดไม่เกิน 1 MB',
              '请选择小于1 MB的有效Roam收藏夹JSON备份。',
              '1 MB未満の有効なRoamコレクションJSONバックアップを選んでください。',
              '1 MB 미만의 올바른 Roam 컬렉션 JSON 백업을 선택하세요.',
            ],
            lang,
          )}
        </p>
      )}
      {removeGroup && (
        <div className="inline-confirm">
          <p>
            {local(
              [
                'Delete this collection? Other collections and your visited list are kept.',
                'ลบชุดสถานที่นี้หรือไม่ ชุดอื่นและรายการที่ไปมาแล้วจะยังอยู่',
                '删除此收藏夹？其他收藏夹和去过的地点将保留。',
                'このコレクションを削除しますか？他のコレクションと訪問済みリストは残ります。',
                '이 컬렉션을 삭제할까요? 다른 컬렉션과 방문 목록은 유지됩니다.',
              ],
              lang,
            )}
          </p>
          <button
            className="button button-red"
            onClick={() => {
              collections.remove(current.id);
              setGroup('someday');
              setRemoveGroup(false);
            }}
          >
            {x(lang, 'remove')}
          </button>
          <button className="button button-outline" onClick={() => setRemoveGroup(false)}>
            {x(lang, 'cancel')}
          </button>
        </div>
      )}
      {pending && (
        <div className="inline-confirm">
          <p>
            {x(lang, 'restore')} · {pending.groups.length} {x(lang, 'collection')} (
            {pending.groups.reduce((n, g) => n + g.places.length, 0)} {x(lang, 'places')})
          </p>
          <p>
            {local(
              [
                'This replaces your current place collections and visited list.',
                'การนำเข้าจะแทนที่ชุดสถานที่และรายการที่ไปมาแล้วในเครื่อง',
                '这将替换当前收藏夹和去过的地点列表。',
                '現在のコレクションと訪問済みリストを置き換えます。',
                '현재 컬렉션과 방문 목록을 대체합니다.',
              ],
              lang,
            )}
          </p>
          <button
            className="button button-red"
            onClick={() => {
              collections.restore(pending);
              setPending(null);
              setGroup('someday');
            }}
          >
            {x(lang, 'restore')}
          </button>
          <button className="button button-outline" onClick={() => setPending(null)}>
            {x(lang, 'cancel')}
          </button>
        </div>
      )}
      <form
        className="collection-create"
        onSubmit={(e) => {
          e.preventDefault();
          collections.create(name);
          setName('');
        }}
      >
        <label>
          {x(lang, 'collectionName')}
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
        </label>
        <button className="button button-outline" disabled={collections.groups.length >= 20}>
          {x(lang, 'create')}
        </button>
      </form>
      <div className="collection-places">
        {current.places.map((id) => {
          const p = findPlace(id)!;
          return (
            <article key={id}>
              <TravelImage
                src={p.state.photos.find((v) => v.placeIndex === p.index)!.src}
                alt=""
                width="100"
                height="80"
                loading="lazy"
              />
              <div>
                <button className="text-link" onClick={() => onOpen(p.state, p.index)}>
                  {local(p.state.placeNames[p.index], lang)}
                </button>
                <label>
                  <input
                    type="checkbox"
                    checked={collections.visited.includes(id)}
                    onChange={() => collections.toggleVisited(id)}
                  />
                  {x(lang, 'visited')}
                </label>
              </div>
              <label>
                {x(lang, 'collection')}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) collections.toggle(id, e.target.value);
                  }}
                >
                  <option value="">{x(lang, 'savePlace')}</option>
                  {collections.groups
                    .filter((g) => g.id !== current.id && !g.places.includes(id))
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name || x(lang, 'someday')}
                      </option>
                    ))}
                </select>
              </label>
              <button
                className="icon-button"
                aria-label={`${x(lang, 'remove')} ${local(p.state.placeNames[p.index], lang)}`}
                onClick={() => collections.toggle(id, current.id)}
              >
                ×
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
