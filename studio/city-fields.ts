import { LANGUAGES, LANGUAGE_NAMES } from '../lib/i18n';

export function cityIssueField(field: string) {
  return field
    .replace(/^guide\./, '')
    .replace(/\.source$/, '.source.url')
    .replace(/\.arrival$/, '.arrival.coordinateSource');
}

export function cityIssueLanguage(field: string) {
  const index =
    field.match(
      /(?:^|\.)(?:intro|title|text|alternative|label|note|fare|vegetarian)\.([0-4])$/,
    )?.[1] ?? field.match(/^airport\.steps\.\d+\.([0-4])$/)?.[1];
  return index === undefined ? undefined : LANGUAGES[Number(index)];
}

export function cityFieldLabel(field: string) {
  const lang = cityIssueLanguage(field);
  let path = lang ? field.replace(/\.\d+$/, '') : field;
  path = path
    .replace(/(?:^|\.)days\.(\d+)/, (_, i) => `วันที่ ${Number(i) + 1}`)
    .replace(/(?:^|\.)areas\.(\d+)/, (_, i) => `ย่านที่ ${Number(i) + 1}`)
    .replace(/stops\.(\d+)/, (_, i) => `มื้อวันที่ ${Number(i) + 1}`)
    .replace(/steps\.(\d+)/, (_, i) => `ขั้นตอนที่ ${Number(i) + 1}`)
    .replace(/coordinates\.0/, 'ละติจูด')
    .replace(/coordinates\.1/, 'ลองจิจูด')
    .replace(/allowance\.0/, 'วงเงินต่ำสุด')
    .replace(/allowance\.1/, 'วงเงินสูงสุด')
    .replace(
      /amounts\.(\d+)\.(\d+)/,
      (_, row, tier) => `รายการ ${Number(row) + 1} ระดับ ${Number(tier) + 1}`,
    )
    .replace(/sources\.(\d+)/, (_, i) => `แหล่งข้อมูลที่ ${Number(i) + 1}`);
  const labels: Record<string, string> = {
    intro: 'คำแนะนำ',
    title: 'ชื่อ',
    text: 'รายละเอียด',
    alternative: 'แผนสำรองตามอากาศ',
    arrival: 'จุดเริ่มเที่ยว',
    label: 'ชื่อจุดเริ่มเที่ยว',
    note: 'หมายเหตุ',
    source: 'แหล่งข้อมูล',
    name: 'ชื่อแหล่งข้อมูล',
    url: 'ลิงก์ HTTPS',
    coordinateSource: 'ลิงก์พิกัด OpenStreetMap',
    checkedAt: 'วันที่ตรวจแล้ว',
    reviewAfter: 'ตรวจครั้งถัดไป',
    airport: 'สนามบิน',
    code: 'รหัสสนามบิน',
    fare: 'ค่าโดยสารและบัตร',
    food: 'อาหาร',
    vegetarian: 'คำแนะนำมังสวิรัติ',
    budget: 'งบประมาณ',
    mapQuery: 'คำค้นแผนที่',
    copy: 'ข้อความส่วนกลาง',
  };
  return (
    path
      .split('.')
      .map((part) => labels[part] ?? part)
      .join(' → ') + (lang ? ` · ${LANGUAGE_NAMES[lang]}` : '')
  );
}
