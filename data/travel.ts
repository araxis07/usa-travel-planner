import catalog from '../content/states.json?overview' with { type: 'json' };
import { translate, languageIndex, type Language } from '../lib/i18n';
export type { Language } from '../lib/i18n';
export type LocalText = readonly [string, string, ...string[]];
export type Region = 'West' | 'Southwest' | 'Midwest' | 'Southeast' | 'Northeast';
export type Interest = 'Nature' | 'Cities' | 'Coast' | 'Culture';
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';
export const local = (text: LocalText, lang: Language) =>
  text[languageIndex(lang)] ?? translate(text[0], text[1], lang);
export const REGION_LABELS: Record<Region, LocalText> = {
  West: ['The West', 'ฝั่งตะวันตก'],
  Southwest: ['Southwest', 'ตะวันตกเฉียงใต้'],
  Midwest: ['Midwest', 'มิดเวสต์'],
  Southeast: ['Southeast', 'ตะวันออกเฉียงใต้'],
  Northeast: ['Northeast', 'ตะวันออกเฉียงเหนือ'],
};
export const INTEREST_LABELS: Record<Interest, LocalText> = {
  Nature: ['Great outdoors', 'ธรรมชาติ'],
  Cities: ['City escapes', 'เมืองน่าเที่ยว'],
  Coast: ['Coastal living', 'ทะเลและชายฝั่ง'],
  Culture: ['Culture & history', 'วัฒนธรรมและประวัติศาสตร์'],
};
export const SEASON_LABELS: Record<Season, LocalText> = {
  Spring: ['Spring', 'ใบไม้ผลิ'],
  Summer: ['Summer', 'ฤดูร้อน'],
  Fall: ['Fall', 'ใบไม้ร่วง'],
  Winter: ['Winter', 'ฤดูหนาว'],
};

export interface PhotoAsset {
  src: string;
  placeIndex: number;
  width: number;
  height: number;
}
export interface Photo extends PhotoAsset {
  source: string;
  author: string;
  license: string;
  licenseUrl: string;
  original: string;
  caption?: string;
  displayCaption?: LocalText;
  captionReviewed?: boolean[];
}
export interface PlaceProfile {
  id: string;
  summary: LocalText;
  summarySources: string[];
  summaryLicense: string;
  access: LocalText;
  stay: LocalText;
  visitMinutes: number;
  coordinates: [number, number];
  locationKind: 'area' | 'entrance' | 'visitor-center';
  locationLabel: LocalText;
  locationSource: string;
  locationCheckedAt: string;
  officialUrl: string;
  bookingUrl: string;
  reviewedAt: string;
  reviewAfter: string;
  translationsReviewed: boolean[];
  advisory?: { text: LocalText; source: string; checkedAt: string };
  planning?: {
    transport: 'transit' | 'car' | 'boat';
    setting: 'indoors' | 'outdoors';
    walking: 'easy' | 'varied';
    interest: Interest;
    months: number[];
  };
}
export interface StateGuide {
  code: string;
  name: string;
  thai: string;
  region: Region;
  interests: Interest[];
  description: LocalText;
  places: string[];
  season: Season[];
  days: number;
  food: LocalText;
  hub: string;
  tip: LocalText;
  names: LocalText;
  placeNames: LocalText[];
  photos: PhotoAsset[];
  cover: number;
  updatedAt: string;
  sources: { name: string; url: string }[];
  destinations: PlaceProfile[];
}

// Editorial starting points, not a live inventory. Each guide links to official tourism information.
export const STATES = catalog.states as unknown as StateGuide[];
export const statePlaces = (state: StateGuide, lang: Language) =>
  state.placeNames.map((name) => local(name, lang));
export const statePhoto = (state: StateGuide) => state.photos[state.cover] ?? state.photos[0];

export const stateName = (state: StateGuide, lang: Language) => local(state.names, lang);
export const tourismUrl = (state: StateGuide) =>
  `https://www.visittheusa.com/destinations/${state.name.toLowerCase().replace(/ /g, '-')}/`;
export interface TripStop {
  code: string;
  days: number;
  notes: string;
  activities?: TripActivity[];
}
export type DayPeriod = 'morning' | 'afternoon' | 'evening';
export interface TripActivity {
  id: string;
  day: number;
  period: DayPeriod;
  placeId?: string;
  title: string;
  minutes: number;
  notes: string;
  startTime?: string;
  bufferMinutes?: number;
}
export interface Trip {
  name: string;
  startDate: string;
  travelers: number;
  dailyBudget: number;
  stops: TripStop[];
  checklist?: { id: string; label: string; done: boolean }[];
  expenses?: TripExpense[];
  budgetMode?: 'daily' | 'items';
}
export interface TripExpense {
  id: string;
  name: string;
  category: 'flight' | 'lodging' | 'transport' | 'food' | 'activities' | 'other';
  planned: number;
  paid: number;
}
export const EMPTY_TRIP: Trip = {
  name: '',
  startDate: '',
  travelers: 2,
  dailyBudget: 150,
  stops: [],
};
export const ROUTES = [
  {
    id: 'southwest',
    title: ['The great Southwest', 'มหัศจรรย์ตะวันตกเฉียงใต้'] as LocalText,
    subtitle: [
      'Red rocks. Open roads. A whole new perspective.',
      'หินสีแดง ถนนกว้าง และมุมมองใหม่ตลอดทาง',
    ] as LocalText,
    image: 'hero',
    days: [3, 3, 2],
    codes: ['AZ', 'UT', 'NV'],
    label: ['THE DESERT COLLECTION', 'เส้นทางทะเลทราย'] as LocalText,
  },
  {
    id: 'pacific',
    title: ['Pacific coast state of mind', 'เลียบแปซิฟิกในจังหวะของคุณ'] as LocalText,
    subtitle: [
      'From evergreen forests to the Golden State.',
      'จากป่าเขียวชอุ่มสู่รัฐทองคำ',
    ] as LocalText,
    image: 'california',
    days: [3, 3, 5],
    codes: ['WA', 'OR', 'CA'],
    label: ['THE COASTAL COLLECTION', 'เส้นทางชายฝั่ง'] as LocalText,
  },
  {
    id: 'new-england',
    title: ['A New England kind of fall', 'ใบไม้ร่วงในนิวอิงแลนด์'] as LocalText,
    subtitle: [
      'Small towns, scenic roads, and maple everything.',
      'เมืองเล็ก ถนนชมวิว และเมเปิลแสนอร่อย',
    ] as LocalText,
    image: 'states/vt-3',
    days: [2, 2, 2, 3],
    codes: ['MA', 'VT', 'NH', 'ME'],
    label: ['THE SLOW TRAVEL COLLECTION', 'เส้นทางเที่ยวแบบค่อยเป็นค่อยไป'] as LocalText,
  },
];

export const GUIDES = [
  {
    id: 'first-trip',
    icon: 'compass',
    category: ['THE ESSENTIALS', 'เตรียมตัวเดินทาง'] as LocalText,
    title: [
      'Your first American adventure, made simpler.',
      'เที่ยวอเมริกาครั้งแรก ให้เป็นเรื่องง่าย',
    ] as LocalText,
    intro: [
      'A little preparation leaves more room for the good stuff. Start with the region that excites you, then build a trip around it.',
      'เตรียมพร้อมอีกนิด แล้วเหลือเวลาให้ประสบการณ์ดี ๆ เริ่มจากภูมิภาคที่อยากไป แล้วค่อยวางแผนรอบ ๆ จุดนั้น',
    ] as LocalText,
    sections: [
      {
        title: ['Start with the map', 'เริ่มต้นที่แผนที่'],
        text: [
          'The United States is vast. For a first visit, one region usually gives you more time to explore than a coast-to-coast checklist. Group nearby destinations and leave time for arrival, transfers, and rest. Alaska and Hawaii need separate flight planning.',
          'อเมริกามีพื้นที่กว้างมาก ทริปแรกที่เลือกหนึ่งภูมิภาคจะมีเวลาเที่ยวมากขึ้น จัดจุดหมายใกล้กัน เผื่อวันมาถึง ต่อรถ และพักผ่อน ส่วนอะแลสกากับฮาวายต้องวางแผนเที่ยวบินแยก',
        ],
      },
      {
        title: ['Check your entry documents', 'ตรวจเอกสารเข้าเมือง'],
        text: [
          'Entry requirements depend on your passport and circumstances. Use the U.S. Department of State and CBP websites to check the documents that apply to you before committing to travel. Keep copies of your bookings and travel documents accessible.',
          'ข้อกำหนดเข้าเมืองขึ้นอยู่กับหนังสือเดินทางและสถานการณ์ของผู้เดินทาง ตรวจข้อมูลที่ตรงกับคุณจากกระทรวงการต่างประเทศสหรัฐฯ และ CBP ก่อนจอง พร้อมเก็บสำเนาเอกสารและการจองให้เปิดดูได้ง่าย',
        ],
      },
      {
        title: ['Build a realistic day', 'จัดวันเที่ยวให้พอดี'],
        text: [
          'Choose one main experience per day, then add nearby possibilities. Check opening days, travel time, accessibility, and advance bookings directly with each venue. Major cities often work well with public transport; rural routes usually need more transport planning.',
          'เลือกกิจกรรมหลักวันละหนึ่งอย่าง แล้วเพิ่มสถานที่ใกล้กัน ตรวจวันเปิด เวลาเดินทาง การเข้าถึง และการจองกับแต่ละแห่ง เมืองใหญ่หลายเมืองใช้ขนส่งสาธารณะสะดวก ส่วนชนบทควรเตรียมการเดินทางมากขึ้น',
        ],
      },
      {
        title: ['Keep the practical things handy', 'เตรียมสิ่งจำเป็นให้พร้อม'],
        text: [
          'Download offline maps, check your phone’s data options, and save accommodation addresses. Review travel insurance and payment options for your own needs. Your Roam trip is saved on this browser; export a copy to take it with you.',
          'ดาวน์โหลดแผนที่ออฟไลน์ ตรวจแพ็กเกจมือถือ และบันทึกที่อยู่ที่พัก พิจารณาประกันเดินทางและวิธีชำระเงินให้เหมาะกับคุณ แผน Roam บันทึกในเบราว์เซอร์นี้ จึงควรส่งออกสำเนาไว้ด้วย',
        ],
      },
    ],
    sources: [
      {
        name: 'U.S. Department of State',
        url: 'https://travel.state.gov/content/travel/en/us-visas/tourism-visit.html',
      },
      {
        name: 'U.S. Customs and Border Protection',
        url: 'https://www.cbp.gov/travel/international-visitors',
      },
    ],
  },
  {
    id: 'parks',
    icon: 'mountain',
    category: ['OUTSIDE IS CALLING', 'ออกไปพบธรรมชาติ'] as LocalText,
    title: [
      'Big parks. A little planning. Better adventures.',
      'อุทยานกว้างใหญ่ เที่ยวได้ดีเมื่อมีแผน',
    ] as LocalText,
    intro: [
      'Make space for the view, and sort out the details before you go. Each park has its own access, seasons, and reservation arrangements.',
      'เผื่อเวลาให้วิวสวย และจัดการรายละเอียดก่อนเดินทาง แต่ละอุทยานมีฤดูกาล วิธีเข้าถึง และระบบจองต่างกัน',
    ] as LocalText,
    sections: [
      {
        title: ['Check the official park page', 'ตรวจหน้าอุทยานทางการ'],
        text: [
          'Use the National Park Service’s Plan Your Visit pages for access, operating hours, alerts, and accessibility. Check them again close to departure: road and trail conditions can change.',
          'ใช้หน้า Plan Your Visit ของ NPS ตรวจการเข้าถึง เวลาเปิด ประกาศ และสิ่งอำนวยความสะดวก แล้วตรวจซ้ำใกล้วันเดินทาง เพราะถนนและเส้นทางอาจเปลี่ยนแปลง',
        ],
      },
      {
        title: ['Separate passes from reservations', 'แยกบัตรผ่านกับการจอง'],
        text: [
          'An entrance pass does not necessarily include a timed-entry reservation, a campsite, or a hiking permit. Review each requirement and the current fees for your party directly with the park. Recreation.gov handles many federal reservations.',
          'บัตรเข้าอุทยานอาจไม่รวมการจองช่วงเวลา แคมป์ หรือใบอนุญาตเดินป่า ตรวจข้อกำหนดและค่าธรรมเนียมปัจจุบันสำหรับกลุ่มของคุณโดยตรง การจองหลายรายการอยู่ที่ Recreation.gov',
        ],
      },
      {
        title: ['Choose the right trail for your group', 'เลือกเส้นทางให้เหมาะกับกลุ่ม'],
        text: [
          'Consider distance, elevation, temperature, shade, and the return journey. Carry appropriate water and supplies, download a map, and tell someone your plan. Visitor centers can help you choose an experience that fits your time and ability.',
          'พิจารณาระยะทาง ความสูง อุณหภูมิ ร่มเงา และขากลับ เตรียมน้ำกับอุปกรณ์ให้เหมาะ ดาวน์โหลดแผนที่ และแจ้งแผนให้คนรู้ ศูนย์บริการนักท่องเที่ยวช่วยเลือกกิจกรรมตามเวลาและความสามารถได้',
        ],
      },
      {
        title: ['Leave room for nature', 'ให้พื้นที่กับธรรมชาติ'],
        text: [
          'Stay on permitted trails, give wildlife space, and take your litter with you. Follow local guidance, including tribal park rules where applicable. Keep a flexible alternative for weather or closures.',
          'อยู่บนเส้นทางที่อนุญาต เว้นระยะจากสัตว์ป่า และนำขยะกลับ ปฏิบัติตามข้อแนะนำท้องถิ่นรวมถึงกฎอุทยานของชนเผ่า พร้อมแผนสำรองเมื่ออากาศเปลี่ยนหรือมีการปิดพื้นที่',
        ],
      },
    ],
    sources: [
      { name: 'NPS travel tips', url: 'https://www.nps.gov/planyourvisit/travel-tips.htm' },
      { name: 'NPS entrance passes', url: 'https://www.nps.gov/planyourvisit/passes.htm' },
      { name: 'Recreation.gov', url: 'https://www.recreation.gov/' },
    ],
  },
  {
    id: 'road-trip',
    icon: 'route',
    category: ['TAKE THE SCENIC ROUTE', 'เลือกเส้นทางที่มีเรื่องราว'] as LocalText,
    title: ['Less rushing. More road-trip memories.', 'รีบน้อยลง จดจำทริปได้มากขึ้น'] as LocalText,
    intro: [
      'The best part of a road trip is often the stop you did not plan. Give your itinerary enough breathing room to find it.',
      'ช่วงเวลาดีที่สุดของโรดทริปอาจเป็นจุดแวะที่ไม่ได้วางแผน เผื่อพื้นที่ในทริปให้กับการค้นพบเหล่านั้น',
    ] as LocalText,
    sections: [
      {
        title: ['Plan stops, then the driving', 'เลือกจุดพัก แล้วค่อยวางเส้นทาง'],
        text: [
          'Choose overnight bases around your must-see places. Our route collections are regional starting points, so choose specific towns and verify the roads between them before booking. Scenic roads can take much longer than the fastest navigation estimate.',
          'เลือกเมืองค้างคืนรอบสถานที่ที่อยากไป เส้นทางแนะนำของเราเป็นจุดเริ่มต้นระดับภูมิภาค ควรเลือกเมืองจริงและตรวจถนนก่อนจอง ถนนชมวิวอาจใช้เวลานานกว่าเส้นทางเร็วที่สุดมาก',
        ],
      },
      {
        title: ['Check the car details', 'ตรวจรายละเอียดรถ'],
        text: [
          'Review your rental provider’s license, age, insurance, mileage, and one-way return conditions. Check parking at accommodation and attractions. For island or remote destinations, check whether your rental can travel on the roads or ferries you intend to use.',
          'ตรวจเงื่อนไขใบขับขี่ อายุ ประกัน ระยะทาง และคืนรถต่างเมืองกับผู้ให้เช่า รวมถึงที่จอดในที่พักและสถานที่เที่ยว สำหรับเกาะหรือพื้นที่ห่างไกล ตรวจว่ารถเช่าเข้าเส้นทางหรือขึ้นเรือที่เลือกได้หรือไม่',
        ],
      },
      {
        title: ['Budget for the whole journey', 'คิดงบทั้งการเดินทาง'],
        text: [
          'Allow for accommodation, meals, fuel, parking, admission, and a buffer. The planner uses your own daily amount per traveler as a simple estimate; add flights, car hire, and any large one-off costs separately. It is not a booking quote.',
          'เผื่องบที่พัก อาหาร น้ำมัน ที่จอด ค่าเข้า และเงินสำรอง เครื่องมือวางแผนใช้จำนวนเงินรายวันต่อคนที่คุณตั้งเองเป็นประมาณการ ควรคิดเที่ยวบิน ค่าเช่ารถ และค่าใช้จ่ายก้อนใหญ่เพิ่ม ไม่ใช่ราคาจองจริง',
        ],
      },
      {
        title: ['Keep a flexible route', 'ยืดหยุ่นเส้นทาง'],
        text: [
          'Check state transport agencies for closures and road conditions. Keep fuel margins on remote roads, download maps, and leave daylight for unfamiliar scenic routes. Build a rest day into longer itineraries.',
          'ตรวจถนนปิดและสภาพถนนจากหน่วยงานคมนาคมของรัฐ เตรียมน้ำมันเผื่อในพื้นที่ไกล ดาวน์โหลดแผนที่ และเลือกขับถนนชมวิวที่ไม่คุ้นช่วงกลางวัน พร้อมแทรกวันพักในทริปยาว',
        ],
      },
    ],
    sources: [
      { name: 'Visit The USA road trips', url: 'https://www.visittheusa.com/road-trips/' },
      { name: 'California road conditions', url: 'https://quickmap.dot.ca.gov/' },
    ],
  },
] satisfies {
  id: string;
  icon: string;
  category: LocalText;
  title: LocalText;
  intro: LocalText;
  sections: { title: LocalText; text: LocalText }[];
  sources: { name: string; url: string }[];
}[];
