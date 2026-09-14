import {
  EMPTY_TRIP,
  STATES,
  ROUTES,
  local,
  type Language,
  type LocalText,
  type Trip,
  type TripActivity,
} from './travel';
import { x } from './experience-copy';
import { findPlace } from '../lib/destinations';

export interface Itinerary {
  id: string;
  title: LocalText;
  subtitle: LocalText;
  image: string;
  label: LocalText;
  codes: string[];
  days: number[];
  schedules: (string | null)[][];
  car: boolean;
}
const cityLabel: LocalText = [
  'THE CITY COLLECTION',
  'เส้นทางเที่ยวเมือง',
  '城市精选',
  '都市を巡る旅',
  '도시 여행 컬렉션',
];
export const ITINERARIES: Itinerary[] = [
  {
    ...ROUTES[0],
    car: true,
    schedules: [
      [null, 'AZ-0', 'AZ-1'],
      [null, 'UT-0', 'UT-1'],
      [null, 'NV-0'],
    ],
  },
  {
    ...ROUTES[1],
    car: true,
    schedules: [
      ['WA-0', 'WA-1', null],
      [null, 'OR-0', 'OR-1'],
      [null, 'CA-0', 'CA-0', null, 'CA-2'],
    ],
  },
  {
    ...ROUTES[2],
    car: true,
    schedules: [
      ['MA-0', 'MA-0'],
      [null, 'VT-1'],
      [null, 'NH-0'],
      [null, 'ME-0', 'ME-0'],
    ],
  },
  {
    id: 'new-york-weekend',
    title: [
      'New York, at your pace',
      'นิวยอร์กในจังหวะของคุณ',
      '慢游纽约',
      '自分のペースでニューヨーク',
      '나만의 속도로 뉴욕',
    ],
    subtitle: [
      'Three days, one city, room to wander.',
      'สามวันในหนึ่งเมือง พร้อมเวลาเดินเล่น',
      '三天一座城，留些时间漫步。',
      'ひとつの街で3日間。散策の余白を。',
      '한 도시에서 3일, 여유롭게 둘러보세요.',
    ],
    label: cityLabel,
    image: 'states/ny-1',
    codes: ['NY'],
    days: [3],
    schedules: [['NY-0', 'NY-0', 'NY-0']],
    car: false,
  },
  {
    id: 'boston-weekend',
    title: [
      'A Boston long weekend',
      'วันหยุดยาวในบอสตัน',
      '波士顿长周末',
      'ボストンで過ごす週末',
      '보스턴에서 긴 주말',
    ],
    subtitle: [
      'History, neighborhoods and a slower city break.',
      'ประวัติศาสตร์ ย่านน่าเดิน และวันพักในเมือง',
      '历史、街区与悠闲城市假期。',
      '歴史と街歩きを楽しむ、ゆったりした休日。',
      '역사와 동네 산책을 즐기는 여유로운 휴가.',
    ],
    label: cityLabel,
    image: 'states/ma-1',
    codes: ['MA'],
    days: [3],
    schedules: [['MA-0', 'MA-0', 'MA-0']],
    car: false,
  },
  {
    id: 'chicago-weekend',
    title: [
      'Chicago by the lake',
      'ชิคาโกริมทะเลสาบ',
      '湖畔芝加哥',
      '湖畔のシカゴ',
      '호숫가의 시카고',
    ],
    subtitle: [
      'Architecture, culture and time by the water.',
      'สถาปัตยกรรม วัฒนธรรม และเวลาริมน้ำ',
      '建筑、文化与水畔时光。',
      '建築、文化、水辺で過ごす時間。',
      '건축과 문화, 물가에서의 여유.',
    ],
    label: cityLabel,
    image: 'states/il-1',
    codes: ['IL'],
    days: [3],
    schedules: [['IL-0', 'IL-0', 'IL-0']],
    car: false,
  },
  {
    id: 'florida-nature',
    title: [
      'Florida beyond the beach',
      'ฟลอริดาที่มีมากกว่าชายหาด',
      '海滩之外的佛罗里达',
      'ビーチの先のフロリダ',
      '해변 너머의 플로리다',
    ],
    subtitle: [
      'Miami, the Everglades and the Keys, with transfer days.',
      'ไมอามี เอเวอร์เกลดส์ และฟลอริดาคีย์ส พร้อมวันเผื่อเดินทาง',
      '迈阿密、大沼泽地与群岛，预留交通日。',
      'マイアミ、エバーグレーズ、キーズ。移動日も確保。',
      '마이애미, 에버글레이즈, 키스와 이동을 위한 날.',
    ],
    label: [
      'THE SUNSHINE COLLECTION',
      'เส้นทางแสงแดด',
      '阳光精选',
      '太陽を楽しむ旅',
      '햇살 여행 컬렉션',
    ],
    image: 'states/fl-3',
    codes: ['FL'],
    days: [7],
    schedules: [['FL-0', 'FL-0', null, 'FL-1', null, 'FL-2', 'FL-2']],
    car: true,
  },
  {
    id: 'wyoming-parks',
    title: [
      'Wyoming, wide open',
      'ไวโอมิงและธรรมชาติกว้างใหญ่',
      '开阔的怀俄明',
      '大自然のワイオミング',
      '광활한 와이오밍',
    ],
    subtitle: [
      'Grand Teton and Yellowstone with breathing room.',
      'แกรนด์ทีตันและเยลโลว์สโตน พร้อมเวลาเที่ยวเต็มที่',
      '大提顿与黄石，留足探索时间。',
      'グランドティトンとイエローストーンをじっくり。',
      '그랜드티턴과 옐로스톤을 여유 있게.',
    ],
    label: [
      'THE NATIONAL PARK COLLECTION',
      'เส้นทางอุทยาน',
      '国家公园精选',
      '国立公園の旅',
      '국립공원 여행 컬렉션',
    ],
    image: 'states/wy-2',
    codes: ['WY'],
    days: [7],
    schedules: [[null, 'WY-1', 'WY-1', null, 'WY-0', 'WY-0', 'WY-0']],
    car: true,
  },
];
const CITY_FOCUS: Record<string, LocalText[]> = {
  'new-york-weekend': [
    [
      'A neighborhood walk in Lower Manhattan',
      'เดินเที่ยวย่านโลเวอร์แมนฮัตตัน',
      '漫步曼哈顿下城',
      'ロウアー・マンハッタンを街歩き',
      '로어맨해튼 동네 산책',
    ],
    [
      'A short walk in Central Park',
      'เดินเล่นระยะสั้นในเซ็นทรัลพาร์ก',
      '中央公园短途散步',
      'セントラルパークで短い散歩',
      '센트럴파크 짧은 산책',
    ],
    [
      'Choose a museum and a nearby café',
      'เลือกพิพิธภัณฑ์และคาเฟ่ใกล้กัน',
      '挑选一座博物馆和附近的咖啡馆',
      '美術館・博物館と近くのカフェを選ぶ',
      '박물관과 근처 카페 선택하기',
    ],
  ],
  'boston-weekend': [
    [
      'Walk a section of the Freedom Trail',
      'เลือกเดินบางช่วงของฟรีดอมเทรล',
      '选择自由之路的一段步行',
      'フリーダム・トレイルの一部を歩く',
      '프리덤 트레일 일부 걷기',
    ],
    [
      'Boston Common and nearby streets',
      'บอสตันคอมมอนและถนนรอบสวน',
      '波士顿公园及周边街道',
      'ボストン・コモンと周辺の街歩き',
      '보스턴 코먼과 주변 거리',
    ],
    [
      'A neighborhood café and an indoor visit',
      'คาเฟ่ในย่านและสถานที่เที่ยวในร่ม',
      '街区咖啡馆与室内参观',
      '街のカフェと屋内の観光スポット',
      '동네 카페와 실내 명소',
    ],
  ],
  'chicago-weekend': [
    [
      'A short walk along the river',
      'เดินเล่นริมแม่น้ำระยะสั้น',
      '沿河短途散步',
      '川沿いで短い散歩',
      '강변 짧은 산책',
    ],
    [
      'Choose one museum for the afternoon',
      'เลือกพิพิธภัณฑ์หนึ่งแห่งสำหรับช่วงบ่าย',
      '下午挑选一座博物馆',
      '午後は美術館・博物館をひとつ選ぶ',
      '오후에 방문할 박물관 하나 선택하기',
    ],
    [
      'Lakeside time and a neighborhood meal',
      'พักผ่อนริมทะเลสาบและกินอาหารในย่าน',
      '湖畔休闲与街区用餐',
      '湖畔でのんびり、街で食事',
      '호숫가 휴식과 동네 식사',
    ],
  ],
};
export function itineraryTrip(route: Itinerary, lang: Language): Trip {
  return {
    ...structuredClone(EMPTY_TRIP),
    name: local(route.title, lang),
    stops: route.codes.map((code, i) => ({
      code,
      days: route.days[i],
      notes: '',
      activities: route.schedules[i].flatMap((id, d): TripActivity[] => {
        const place = id ? findPlace(id) : undefined;
        const free = id === 'free';
        const focus = CITY_FOCUS[route.id]?.[d];
        const mainMinutes = place ? Math.min(240, place.profile.visitMinutes) : free ? 90 : 360;
        return [
          {
            id: crypto.randomUUID(),
            day: d + 1,
            period: 'morning',
            title: place ? place.state.places[place.index] : x(lang, free ? 'rest' : 'transfer'),
            minutes: mainMinutes,
            notes: '',
            startTime: '09:00',
            bufferMinutes: 30,
            ...(place ? { placeId: place.id } : {}),
          },
          {
            id: crypto.randomUUID(),
            day: d + 1,
            period: 'afternoon',
            title: x(lang, 'lunch'),
            minutes: 60,
            notes: '',
            startTime: place || free ? '13:30' : '15:30',
            bufferMinutes: 30,
          },
          ...(focus
            ? [
                {
                  id: crypto.randomUUID(),
                  day: d + 1,
                  period: 'afternoon' as const,
                  title: local(focus, lang),
                  minutes: 90,
                  notes: x(lang, 'templateNote'),
                  startTime: '15:00',
                  bufferMinutes: 30,
                },
              ]
            : []),
          {
            id: crypto.randomUUID(),
            day: d + 1,
            period: 'evening',
            title: x(lang, 'rest'),
            minutes: 90,
            notes: '',
            startTime: '18:00',
            bufferMinutes: 0,
          },
        ];
      }),
    })),
  };
}
export function starterTrip(placeId: string, days: number, lang: Language): Trip {
  const place = findPlace(placeId)!;
  const state = STATES.find((s) => s.code === place.state.code)!;
  return itineraryTrip(
    {
      id: 'starter',
      title: state.placeNames[place.index],
      subtitle: state.description,
      image: '',
      label: cityLabel,
      codes: [state.code],
      days: [days],
      schedules: [Array.from({ length: days }, (_, i) => (i === 0 ? placeId : 'free'))],
      car: place.profile.planning?.transport !== 'transit',
    },
    lang,
  );
}
