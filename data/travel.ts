export type Language = 'en' | 'th';
export type LocalText = readonly [string, string];
export type Region = 'West' | 'Southwest' | 'Midwest' | 'Southeast' | 'Northeast';
export type Interest = 'Nature' | 'Cities' | 'Coast' | 'Culture';
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';
export const local = (text: LocalText, lang: Language) => text[lang === 'th' ? 1 : 0];
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
  image?: string;
}

// Editorial starting points, not a live inventory. Each guide links to official tourism information.
export const STATES: StateGuide[] = [
  {
    code: 'CA',
    name: 'California',
    thai: 'แคลิฟอร์เนีย',
    region: 'West',
    interests: ['Coast', 'Cities', 'Nature'],
    description: [
      'Chase the Pacific, wander among redwoods, and find your own golden state of mind.',
      'เลียบมหาสมุทรแปซิฟิก เดินใต้ต้นเรดวูด และค้นพบเสน่ห์ของรัฐทองคำในแบบของคุณ',
    ],
    places: ['San Francisco', 'Yosemite National Park', 'Big Sur'],
    season: ['Spring', 'Fall'],
    days: 7,
    food: ['Fish tacos & farmers’ markets', 'ทาโก้ปลาและตลาดเกษตรกร'],
    hub: 'SFO / LAX',
    tip: [
      'Choose one part of this large state first. Check Caltrans for coastal road closures before driving Highway 1.',
      'เริ่มจากหนึ่งภูมิภาคของรัฐ และตรวจสอบการปิดถนนกับ Caltrans ก่อนขับ Highway 1',
    ],
    image: 'california',
  },
  {
    code: 'NY',
    name: 'New York',
    thai: 'นิวยอร์ก',
    region: 'Northeast',
    interests: ['Cities', 'Culture', 'Nature'],
    description: [
      'Big-city energy, small-town discoveries, and a little something that stays with you.',
      'สัมผัสพลังของมหานคร เสน่ห์เมืองเล็ก และเรื่องราวที่อยากจดจำ',
    ],
    places: ['New York City', 'Hudson Valley', 'Niagara Falls'],
    season: ['Spring', 'Fall'],
    days: 5,
    food: ['Bagels, pizza & neighborhood delis', 'เบเกิล พิซซ่า และร้านเดลีท้องถิ่น'],
    hub: 'JFK / EWR / LGA',
    tip: [
      'Use transit in New York City. Allow separate travel days for Niagara Falls; it is far from Manhattan.',
      'ใช้ขนส่งสาธารณะในนิวยอร์กซิตี้ และเผื่อวันเดินทางไปไนแอการาซึ่งอยู่ไกลจากแมนฮัตตัน',
    ],
    image: 'new-york',
  },
  {
    code: 'AZ',
    name: 'Arizona',
    thai: 'แอริโซนา',
    region: 'Southwest',
    interests: ['Nature', 'Culture'],
    description: [
      'Red-rock horizons, canyon-country sunrises, and wide-open possibilities.',
      'ขอบฟ้าหินสีแดง แสงเช้าเหนือแคนยอน และพื้นที่กว้างไกลให้ค้นหา',
    ],
    places: ['Grand Canyon South Rim', 'Sedona', 'Monument Valley Navajo Tribal Park'],
    season: ['Spring', 'Fall'],
    days: 5,
    food: ['Sonoran-style Mexican cooking', 'อาหารเม็กซิกันสไตล์โซโนรา'],
    hub: 'PHX',
    tip: [
      'Desert heat and elevation change quickly. Check tribal park access separately from National Park Service sites.',
      'อุณหภูมิทะเลทรายและระดับความสูงแตกต่างกันมาก ตรวจเงื่อนไขอุทยานของชนเผ่าแยกจากอุทยานของ NPS',
    ],
    image: 'arizona',
  },
  {
    code: 'HI',
    name: 'Hawaii',
    thai: 'ฮาวาย',
    region: 'West',
    interests: ['Coast', 'Nature', 'Culture'],
    description: [
      'Slow down to island time, with volcanic landscapes and an ocean in every shade of blue.',
      'ใช้ชีวิตตามจังหวะเกาะ ท่ามกลางภูเขาไฟและมหาสมุทรหลากเฉดสีฟ้า',
    ],
    places: ['Oʻahu', 'Hawaiʻi Volcanoes National Park', 'Kauaʻi'],
    season: ['Spring', 'Fall'],
    days: 7,
    food: ['Poke, plate lunches & shave ice', 'โปเกะ ข้าวจานฮาวาย และน้ำแข็งไส'],
    hub: 'HNL / KOA / OGG',
    tip: [
      'Choose one or two islands, respect sacred places, and follow local ocean and trail advisories.',
      'เลือกเที่ยวหนึ่งหรือสองเกาะ เคารพสถานที่ศักดิ์สิทธิ์ และตรวจประกาศทะเลกับเส้นทางเดินป่า',
    ],
    image: 'hawaii',
  },
  {
    code: 'UT',
    name: 'Utah',
    thai: 'ยูทาห์',
    region: 'Southwest',
    interests: ['Nature'],
    description: [
      'Sandstone arches and towering canyon walls turn every mile into a discovery.',
      'ซุ้มประตูหินทรายและหน้าผาแคนยอนสูงใหญ่ ทำให้ทุกเส้นทางน่าค้นหา',
    ],
    places: ['Zion National Park', 'Bryce Canyon National Park', 'Arches National Park'],
    season: ['Spring', 'Fall'],
    days: 6,
    food: ['Local diners & regional produce', 'ร้านไดเนอร์และผลผลิตท้องถิ่น'],
    hub: 'SLC',
    tip: [
      'Check each park’s reservations, shuttle service, and trail permits before setting your route.',
      'ตรวจระบบจอง รถรับส่ง และใบอนุญาตเส้นทางของแต่ละอุทยานก่อนจัดทริป',
    ],
  },
  {
    code: 'CO',
    name: 'Colorado',
    thai: 'โคโลราโด',
    region: 'West',
    interests: ['Nature', 'Cities'],
    description: [
      'Alpine air, mountain towns, and trails that take the long way to somewhere wonderful.',
      'อากาศบนภูเขา เมืองเล็กกลางหุบเขา และเส้นทางเดินที่เต็มไปด้วยวิวสวย',
    ],
    places: ['Rocky Mountain National Park', 'Denver', 'Mesa Verde National Park'],
    season: ['Summer', 'Fall', 'Winter'],
    days: 5,
    food: ['Green chile & mountain-town cafés', 'กรีนชิลีและคาเฟ่ในเมืองภูเขา'],
    hub: 'DEN',
    tip: [
      'Take time to adjust to altitude. High mountain roads can close well outside the winter months.',
      'เผื่อเวลาปรับตัวกับความสูง ถนนบนภูเขาอาจปิดแม้ไม่ใช่ช่วงฤดูหนาว',
    ],
  },
  {
    code: 'FL',
    name: 'Florida',
    thai: 'ฟลอริดา',
    region: 'Southeast',
    interests: ['Coast', 'Cities', 'Nature'],
    description: [
      'A sunny mix of art-deco streets, wild wetlands, and easygoing island stops.',
      'ถนนอาร์ตเดโค พื้นที่ชุ่มน้ำธรรมชาติ และหมู่เกาะบรรยากาศสบาย',
    ],
    places: ['Miami Beach', 'Everglades National Park', 'Florida Keys'],
    season: ['Winter', 'Spring'],
    days: 6,
    food: ['Cuban sandwiches & Key lime pie', 'แซนด์วิชคิวบาและคีย์ไลม์พาย'],
    hub: 'MIA / MCO',
    tip: [
      'Build in drive time between regions and monitor official tropical weather forecasts for your dates.',
      'เผื่อเวลาขับรถข้ามภูมิภาค และตรวจพยากรณ์พายุเขตร้อนจากหน่วยงานทางการ',
    ],
  },
  {
    code: 'WA',
    name: 'Washington',
    thai: 'วอชิงตัน',
    region: 'West',
    interests: ['Nature', 'Cities', 'Coast'],
    description: [
      'Coffee-fueled city mornings meet evergreen forests and wild Pacific shores.',
      'เริ่มเช้าด้วยกาแฟในเมือง แล้วออกไปพบป่าเขียวและชายฝั่งแปซิฟิก',
    ],
    places: ['Seattle', 'Olympic National Park', 'Mount Rainier National Park'],
    season: ['Summer', 'Fall'],
    days: 5,
    food: ['Pacific seafood & coffee', 'อาหารทะเลแปซิฟิกและกาแฟ'],
    hub: 'SEA',
    tip: [
      'Mountain access is seasonal; ferry bookings can help if your plans include a vehicle crossing.',
      'ตรวจฤดูกาลเปิดถนนบนภูเขา และวางแผนจองเรือเฟอร์รีหากนำรถข้ามด้วย',
    ],
  },
  {
    code: 'AL',
    name: 'Alabama',
    thai: 'แอละแบมา',
    region: 'Southeast',
    interests: ['Culture', 'Coast'],
    description: [
      'Trace civil rights history, discover musical roots, and unwind on the Gulf Coast.',
      'เรียนรู้ประวัติศาสตร์สิทธิพลเมือง รากเหง้าดนตรี และพักริมชายฝั่งอ่าว',
    ],
    places: ['Birmingham Civil Rights District', 'Muscle Shoals', 'Gulf Shores'],
    season: ['Spring', 'Fall'],
    days: 4,
    food: ['Barbecue & Gulf seafood', 'บาร์บีคิวและอาหารทะเลจากอ่าว'],
    hub: 'BHM',
    tip: [
      'Book museum visits around opening days and leave time between northern Alabama and the coast.',
      'ตรวจวันเปิดพิพิธภัณฑ์และเผื่อเวลาเดินทางจากตอนเหนือไปชายฝั่ง',
    ],
  },
  {
    code: 'AK',
    name: 'Alaska',
    thai: 'อะแลสกา',
    region: 'West',
    interests: ['Nature', 'Coast'],
    description: [
      'Glaciers, immense wilderness, and summer days that seem to last forever.',
      'ธารน้ำแข็ง ธรรมชาติกว้างใหญ่ และวันฤดูร้อนที่ยาวนาน',
    ],
    places: ['Denali National Park', 'Kenai Fjords National Park', 'Juneau'],
    season: ['Summer'],
    days: 8,
    food: ['Salmon & local seafood', 'แซลมอนและอาหารทะเลท้องถิ่น'],
    hub: 'ANC / JNU',
    tip: [
      'Distances are large and some places require a flight or ferry. Check Denali road access before booking.',
      'ระยะทางไกลและบางพื้นที่ต้องใช้เครื่องบินหรือเรือ ตรวจการเข้าถึงถนนเดนาลีก่อนจอง',
    ],
  },
  {
    code: 'AR',
    name: 'Arkansas',
    thai: 'อาร์คันซอ',
    region: 'Southeast',
    interests: ['Nature', 'Culture'],
    description: [
      'Follow clear rivers through the Ozarks, then make time for art and historic bathhouses.',
      'ล่องไปตามแม่น้ำในโอซาร์ก ก่อนแวะชมศิลปะและโรงอาบน้ำเก่าแก่',
    ],
    places: ['Hot Springs National Park', 'Buffalo National River', 'Bentonville'],
    season: ['Spring', 'Fall'],
    days: 4,
    food: ['Southern cooking & barbecue', 'อาหารใต้และบาร์บีคิว'],
    hub: 'LIT / XNA',
    tip: [
      'Check river conditions before paddling and reserve popular bathhouse experiences ahead.',
      'ตรวจระดับน้ำก่อนพายเรือและจองบริการโรงอาบน้ำยอดนิยมล่วงหน้า',
    ],
  },
  {
    code: 'CT',
    name: 'Connecticut',
    thai: 'คอนเนตทิคัต',
    region: 'Northeast',
    interests: ['Culture', 'Coast'],
    description: [
      'Maritime villages, university museums, and a slower side of New England.',
      'หมู่บ้านริมทะเล พิพิธภัณฑ์มหาวิทยาลัย และนิวอิงแลนด์ในจังหวะผ่อนคลาย',
    ],
    places: ['Mystic Seaport', 'New Haven', 'Litchfield Hills'],
    season: ['Summer', 'Fall'],
    days: 3,
    food: ['New Haven-style pizza', 'พิซซ่าสไตล์นิวเฮเวน'],
    hub: 'BDL',
    tip: [
      'Coastal cities have rail links; a car makes the inland villages easier to explore.',
      'เมืองชายฝั่งหลายแห่งเดินทางด้วยรถไฟได้ ส่วนหมู่บ้านตอนในเหมาะกับการใช้รถ',
    ],
  },
  {
    code: 'DE',
    name: 'Delaware',
    thai: 'เดลาแวร์',
    region: 'Northeast',
    interests: ['Coast', 'Culture'],
    description: [
      'Compact coastal escapes with beach-town boardwalks and quiet historic corners.',
      'ทริปชายฝั่งขนาดกะทัดรัด พร้อมทางเดินริมทะเลและมุมประวัติศาสตร์',
    ],
    places: ['Rehoboth Beach', 'Cape Henlopen State Park', 'Wilmington'],
    season: ['Summer', 'Fall'],
    days: 3,
    food: ['Coastal seafood & boardwalk treats', 'อาหารทะเลและของกินริมบอร์ดวอล์ก'],
    hub: 'PHL (Pennsylvania)',
    tip: [
      'Beach parking fills on summer weekends; stay nearby or start your day early.',
      'ที่จอดรถชายหาดเต็มเร็วช่วงสุดสัปดาห์ฤดูร้อน ควรพักใกล้หรือออกเช้า',
    ],
  },
  {
    code: 'GA',
    name: 'Georgia',
    thai: 'จอร์เจีย',
    region: 'Southeast',
    interests: ['Cities', 'Culture', 'Coast'],
    description: [
      'Creative city neighborhoods give way to oak-shaded squares and barrier islands.',
      'จากย่านสร้างสรรค์ในเมืองสู่จัตุรัสใต้ร่มโอ๊กและหมู่เกาะชายฝั่ง',
    ],
    places: ['Atlanta', 'Savannah', 'Jekyll Island'],
    season: ['Spring', 'Fall'],
    days: 5,
    food: ['Southern cooking & peach desserts', 'อาหารใต้และขนมจากพีช'],
    hub: 'ATL / SAV',
    tip: [
      'Atlanta and Savannah are a substantial drive apart. Plan overnight stops for both.',
      'แอตแลนตาและสะวันนาอยู่ห่างกันมาก ควรวางแผนค้างคืนในทั้งสองเมือง',
    ],
  },
  {
    code: 'ID',
    name: 'Idaho',
    thai: 'ไอดาโฮ',
    region: 'West',
    interests: ['Nature'],
    description: [
      'Discover mountain lakes, volcanic landscapes, and an outdoorsy capital.',
      'ค้นพบทะเลสาบกลางภูเขา ภูมิประเทศภูเขาไฟ และเมืองหลวงใกล้ธรรมชาติ',
    ],
    places: ['Sawtooth Mountains', 'Boise', 'Craters of the Moon'],
    season: ['Summer', 'Fall'],
    days: 4,
    food: ['Trout & local potatoes', 'ปลาเทราต์และมันฝรั่งท้องถิ่น'],
    hub: 'BOI',
    tip: [
      'Bring offline maps for remote areas and check seasonal access to mountain campgrounds.',
      'ดาวน์โหลดแผนที่ออฟไลน์และตรวจฤดูกาลเปิดพื้นที่ตั้งแคมป์บนภูเขา',
    ],
  },
  {
    code: 'IL',
    name: 'Illinois',
    thai: 'อิลลินอยส์',
    region: 'Midwest',
    interests: ['Cities', 'Culture'],
    description: [
      'Lakefront architecture, neighborhood food, and the beginnings of Route 66.',
      'สถาปัตยกรรมริมทะเลสาบ อาหารประจำย่าน และจุดเริ่มต้นของ Route 66',
    ],
    places: ['Chicago', 'Springfield', 'Starved Rock State Park'],
    season: ['Summer', 'Fall'],
    days: 4,
    food: ['Deep-dish pizza & Chicago-style hot dogs', 'พิซซ่าดีปดิชและฮอตดอกชิคาโก'],
    hub: 'ORD / MDW',
    tip: [
      'Explore Chicago by train and on foot; rent a car only when you head beyond the city.',
      'ใช้รถไฟและเดินในชิคาโก แล้วค่อยเช่ารถเมื่อต้องออกนอกเมือง',
    ],
  },
  {
    code: 'IN',
    name: 'Indiana',
    thai: 'อินดีแอนา',
    region: 'Midwest',
    interests: ['Culture', 'Nature'],
    description: [
      'Racing heritage, lakeside dunes, and inviting small-town main streets.',
      'ประวัติศาสตร์มอเตอร์สปอร์ต เนินทรายริมทะเลสาบ และถนนเมืองเล็กน่าเดิน',
    ],
    places: ['Indianapolis', 'Indiana Dunes National Park', 'Bloomington'],
    season: ['Summer', 'Fall'],
    days: 3,
    food: ['Breaded pork tenderloin sandwiches', 'แซนด์วิชหมูทอดสไตล์ท้องถิ่น'],
    hub: 'IND',
    tip: [
      'Book well ahead around major racing events in Indianapolis.',
      'จองที่พักล่วงหน้าหากเดินทางช่วงการแข่งขันรถรายการใหญ่ในอินเดียแนโพลิส',
    ],
  },
  {
    code: 'IA',
    name: 'Iowa',
    thai: 'ไอโอวา',
    region: 'Midwest',
    interests: ['Culture', 'Nature'],
    description: [
      'Rolling landscapes, river towns, and a surprisingly creative capital.',
      'เนินเขาต่อเนื่อง เมืองริมแม่น้ำ และเมืองหลวงที่เต็มไปด้วยความคิดสร้างสรรค์',
    ],
    places: ['Des Moines', 'Madison County', 'Dubuque'],
    season: ['Summer', 'Fall'],
    days: 3,
    food: ['Sweet corn & local farm produce', 'ข้าวโพดหวานและผลผลิตจากฟาร์ม'],
    hub: 'DSM',
    tip: [
      'A car is the most flexible way to connect rural sights and river towns.',
      'รถยนต์ช่วยให้เชื่อมต่อสถานที่ในชนบทและเมืองริมแม่น้ำได้สะดวก',
    ],
  },
  {
    code: 'KS',
    name: 'Kansas',
    thai: 'แคนซัส',
    region: 'Midwest',
    interests: ['Nature', 'Culture'],
    description: [
      'Big skies, tallgrass prairie, and stories from the heart of the country.',
      'ท้องฟ้ากว้าง ทุ่งหญ้าสูง และเรื่องราวจากใจกลางประเทศ',
    ],
    places: ['Tallgrass Prairie National Preserve', 'Wichita', 'Lawrence'],
    season: ['Spring', 'Fall'],
    days: 3,
    food: ['Barbecue & farm-to-table cooking', 'บาร์บีคิวและอาหารจากฟาร์ม'],
    hub: 'ICT',
    tip: [
      'Prairie trails are exposed; carry water and check weather before a long walk.',
      'เส้นทางทุ่งหญ้ามีร่มเงาน้อย เตรียมน้ำและตรวจอากาศก่อนเดินไกล',
    ],
  },
  {
    code: 'KY',
    name: 'Kentucky',
    thai: 'เคนทักกี',
    region: 'Southeast',
    interests: ['Culture', 'Nature'],
    description: [
      'Horse country, limestone caves, and rich traditions around every bend.',
      'ทุ่งเลี้ยงม้า ถ้ำหินปูน และวัฒนธรรมท้องถิ่นตลอดเส้นทาง',
    ],
    places: ['Louisville', 'Mammoth Cave National Park', 'Lexington'],
    season: ['Spring', 'Fall'],
    days: 4,
    food: ['Hot Brown sandwiches & regional barbecue', 'แซนด์วิชฮอตบราวน์และบาร์บีคิวท้องถิ่น'],
    hub: 'SDF / LEX',
    tip: [
      'Reserve guided cave tours in advance; many routes have stairs and uneven ground.',
      'จองทัวร์ถ้ำล่วงหน้า และตรวจความยากเพราะหลายเส้นทางมีบันไดกับพื้นขรุขระ',
    ],
  },
  {
    code: 'LA',
    name: 'Louisiana',
    thai: 'ลุยเซียนา',
    region: 'Southeast',
    interests: ['Culture', 'Cities'],
    description: [
      'Let live music, Creole flavors, and bayou landscapes set the pace.',
      'ปล่อยให้ดนตรีสด อาหารครีโอล และภูมิประเทศบายูกำหนดจังหวะทริป',
    ],
    places: ['New Orleans', 'Lafayette', 'Atchafalaya Basin'],
    season: ['Spring', 'Fall'],
    days: 4,
    food: ['Gumbo, jambalaya & beignets', 'กัมโบ จัมบาลายา และเบนเยต์'],
    hub: 'MSY',
    tip: [
      'Festival dates change the city’s pace and room availability; check the calendar before booking.',
      'เทศกาลส่งผลต่อบรรยากาศและจำนวนห้องพัก ควรตรวจปฏิทินก่อนจอง',
    ],
  },
  {
    code: 'ME',
    name: 'Maine',
    thai: 'เมน',
    region: 'Northeast',
    interests: ['Coast', 'Nature'],
    description: [
      'Rocky shores, lighthouse views, and forest trails beside the Atlantic.',
      'ชายฝั่งหิน ประภาคาร และเส้นทางป่าริมแอตแลนติก',
    ],
    places: ['Acadia National Park', 'Portland', 'Camden'],
    season: ['Summer', 'Fall'],
    days: 5,
    food: ['Lobster rolls & wild blueberries', 'ล็อบสเตอร์โรลและบลูเบอร์รีป่า'],
    hub: 'PWM / BGR',
    tip: [
      'Check Acadia vehicle reservations for specific roads and book coastal stays early in peak season.',
      'ตรวจการจองรถเข้าเส้นทางบางแห่งของอาคาเดีย และจองที่พักชายฝั่งล่วงหน้าช่วงยอดนิยม',
    ],
  },
  {
    code: 'MD',
    name: 'Maryland',
    thai: 'แมริแลนด์',
    region: 'Southeast',
    interests: ['Coast', 'Culture', 'Cities'],
    description: [
      'Harbor neighborhoods, sailing towns, and quiet Chesapeake Bay shorelines.',
      'ย่านท่าเรือ เมืองแห่งเรือใบ และชายฝั่งอ่าวเชซาพีกแสนสงบ',
    ],
    places: ['Baltimore', 'Annapolis', 'Assateague Island'],
    season: ['Spring', 'Fall', 'Summer'],
    days: 4,
    food: ['Crab cakes & Chesapeake seafood', 'แครบเค้กและอาหารทะเลเชซาพีก'],
    hub: 'BWI',
    tip: [
      'Keep a respectful distance from wild horses at Assateague and follow park guidance.',
      'รักษาระยะห่างจากม้าป่าที่แอสซาทีกและปฏิบัติตามคำแนะนำอุทยาน',
    ],
  },
  {
    code: 'MA',
    name: 'Massachusetts',
    thai: 'แมสซาชูเซตส์',
    region: 'Northeast',
    interests: ['Culture', 'Cities', 'Coast'],
    description: [
      'Walk through history, explore coastal towns, and catch a little New England charm.',
      'เดินผ่านเรื่องราวประวัติศาสตร์ เที่ยวเมืองชายฝั่ง และสัมผัสเสน่ห์นิวอิงแลนด์',
    ],
    places: ['Boston', 'Cape Cod', 'The Berkshires'],
    season: ['Summer', 'Fall'],
    days: 5,
    food: ['Clam chowder & lobster rolls', 'ซุปหอยแคลมและล็อบสเตอร์โรล'],
    hub: 'BOS',
    tip: [
      'Use transit in Boston and consider ferry options for island visits during the operating season.',
      'ใช้ขนส่งสาธารณะในบอสตัน และตรวจเรือเฟอร์รีหากไปเที่ยวเกาะ',
    ],
  },
  {
    code: 'MI',
    name: 'Michigan',
    thai: 'มิชิแกน',
    region: 'Midwest',
    interests: ['Coast', 'Nature', 'Cities'],
    description: [
      'Freshwater horizons, creative Detroit, and lakeside towns made for lingering.',
      'ขอบฟ้าทะเลสาบ ดีทรอยต์เมืองสร้างสรรค์ และเมืองริมน้ำที่น่าใช้เวลา',
    ],
    places: ['Detroit', 'Sleeping Bear Dunes', 'Mackinac Island'],
    season: ['Summer', 'Fall'],
    days: 5,
    food: ['Detroit-style pizza & cherries', 'พิซซ่าดีทรอยต์และเชอร์รี'],
    hub: 'DTW / TVC',
    tip: [
      'Mackinac Island is reached by ferry; check schedules and plan around its car-free setting.',
      'ไปเกาะแมกคิแนกด้วยเรือเฟอร์รี ตรวจตารางและวางแผนเที่ยวบนเกาะที่ไม่ใช้รถยนต์',
    ],
  },
  {
    code: 'MN',
    name: 'Minnesota',
    thai: 'มินนิโซตา',
    region: 'Midwest',
    interests: ['Nature', 'Cities'],
    description: [
      'Pair the Twin Cities with pine forests and the rugged shores of Lake Superior.',
      'เที่ยวทวินซิตีส์ แล้วออกสู่ป่าสนและชายฝั่งทะเลสาบซูพีเรีย',
    ],
    places: ['Minneapolis–Saint Paul', 'North Shore', 'Voyageurs National Park'],
    season: ['Summer', 'Fall'],
    days: 5,
    food: ['Wild rice dishes & local walleye', 'อาหารจากข้าวป่าและปลาวอลอาย'],
    hub: 'MSP',
    tip: [
      'Much of Voyageurs is water-based; arrange a boat, tour, or suitable campsite before you arrive.',
      'หลายพื้นที่ในโวยาเจอร์สต้องเข้าทางน้ำ ควรวางแผนเรือ ทัวร์ หรือพื้นที่แคมป์ก่อน',
    ],
  },
  {
    code: 'MS',
    name: 'Mississippi',
    thai: 'มิสซิสซิปปี',
    region: 'Southeast',
    interests: ['Culture', 'Coast'],
    description: [
      'Follow the blues through Delta towns, historic riverfronts, and the Gulf Coast.',
      'ตามรอยบลูส์ผ่านเมืองเดลตา ริมแม่น้ำเก่าแก่ และชายฝั่งอ่าว',
    ],
    places: ['Clarksdale', 'Natchez', 'Gulf Islands National Seashore'],
    season: ['Spring', 'Fall'],
    days: 4,
    food: ['Delta tamales & catfish', 'ทามาเลสเดลตาและปลาดุกทอด'],
    hub: 'JAN / GPT',
    tip: [
      'Music venues and small museums have varied opening days; check directly before detouring.',
      'สถานที่แสดงดนตรีและพิพิธภัณฑ์เล็กมีวันเปิดต่างกัน ควรตรวจโดยตรงก่อนเดินทาง',
    ],
  },
  {
    code: 'MO',
    name: 'Missouri',
    thai: 'มิสซูรี',
    region: 'Midwest',
    interests: ['Cities', 'Culture', 'Nature'],
    description: [
      'Find jazz, riverfront landmarks, and a generous helping of Ozark scenery.',
      'สัมผัสแจ๊ซ แลนด์มาร์กริมแม่น้ำ และธรรมชาติแห่งโอซาร์ก',
    ],
    places: ['St. Louis', 'Kansas City', 'Ozark National Scenic Riverways'],
    season: ['Spring', 'Fall'],
    days: 4,
    food: ['Kansas City barbecue & toasted ravioli', 'บาร์บีคิวแคนซัสซิตีและราวิโอลีทอด'],
    hub: 'STL / MCI',
    tip: [
      'St. Louis and Kansas City make separate bases; reserve time for the drive between them.',
      'เซนต์หลุยส์และแคนซัสซิตีเหมาะเป็นฐานพักคนละช่วง ควรเผื่อเวลาขับระหว่างเมือง',
    ],
  },
  {
    code: 'MT',
    name: 'Montana',
    thai: 'มอนแทนา',
    region: 'West',
    interests: ['Nature', 'Culture'],
    description: [
      'Glacial valleys, open plains, and mountain towns under an enormous sky.',
      'หุบเขาธารน้ำแข็ง ทุ่งกว้าง และเมืองภูเขาใต้ท้องฟ้าใหญ่',
    ],
    places: ['Glacier National Park', 'Bozeman', 'Little Bighorn Battlefield'],
    season: ['Summer', 'Fall'],
    days: 6,
    food: ['Huckleberry treats & local ranch fare', 'ขนมฮักเคิลเบอร์รีและอาหารท้องถิ่น'],
    hub: 'BZN / FCA',
    tip: [
      'Check Glacier road access and entry arrangements, and follow wildlife-distance guidance.',
      'ตรวจถนนและระบบเข้าอุทยานเกลเชียร์ พร้อมทำตามข้อแนะนำระยะห่างจากสัตว์ป่า',
    ],
  },
  {
    code: 'NE',
    name: 'Nebraska',
    thai: 'เนแบรสกา',
    region: 'Midwest',
    interests: ['Nature', 'Culture'],
    description: [
      'Prairie horizons, pioneer landmarks, and lively neighborhoods in Omaha.',
      'ทุ่งหญ้าสุดขอบฟ้า ร่องรอยผู้บุกเบิก และย่านคึกคักในโอมาฮา',
    ],
    places: ['Omaha', 'Scotts Bluff National Monument', 'Sandhills'],
    season: ['Spring', 'Fall'],
    days: 4,
    food: ['Runza sandwiches & farm produce', 'แซนด์วิชรันซาและผลผลิตจากฟาร์ม'],
    hub: 'OMA',
    tip: [
      'Cross-state drives are long; plan fuel and overnight stops before heading west.',
      'การขับข้ามรัฐใช้เวลานาน วางแผนเติมน้ำมันและจุดพักค้างก่อนมุ่งตะวันตก',
    ],
  },
  {
    code: 'NV',
    name: 'Nevada',
    thai: 'เนวาดา',
    region: 'Southwest',
    interests: ['Cities', 'Nature'],
    description: [
      'Beyond the neon: desert art, dramatic rock formations, and a very blue alpine lake.',
      'นอกเหนือจากแสงนีออน ยังมีศิลปะทะเลทราย หินรูปร่างแปลกตา และทะเลสาบสีฟ้า',
    ],
    places: ['Las Vegas', 'Valley of Fire State Park', 'Lake Tahoe'],
    season: ['Spring', 'Fall'],
    days: 4,
    food: [
      'Global dining & Basque cooking in northern Nevada',
      'อาหารนานาชาติและอาหารบาสก์ทางตอนเหนือ',
    ],
    hub: 'LAS / RNO',
    tip: [
      'Southern desert and northern mountain trips have different seasons and large travel distances.',
      'ทะเลทรายตอนใต้และภูเขาตอนเหนือมีฤดูกาลต่างกันและอยู่ห่างกันมาก',
    ],
  },
  {
    code: 'NH',
    name: 'New Hampshire',
    thai: 'นิวแฮมป์เชียร์',
    region: 'Northeast',
    interests: ['Nature', 'Coast'],
    description: [
      'White Mountain trails, lakeside afternoons, and classic autumn drives.',
      'เส้นทางไวต์เมาน์เทน ช่วงบ่ายริมทะเลสาบ และถนนชมใบไม้เปลี่ยนสี',
    ],
    places: ['White Mountains', 'Lake Winnipesaukee', 'Portsmouth'],
    season: ['Summer', 'Fall', 'Winter'],
    days: 4,
    food: ['Maple treats & New England seafood', 'ขนมเมเปิลและอาหารทะเลนิวอิงแลนด์'],
    hub: 'MHT',
    tip: [
      'Mountain weather changes rapidly. Check summit forecasts separately from town weather.',
      'อากาศภูเขาเปลี่ยนเร็ว ควรดูพยากรณ์บนยอดเขาแยกจากอากาศในเมือง',
    ],
  },
  {
    code: 'NJ',
    name: 'New Jersey',
    thai: 'นิวเจอร์ซีย์',
    region: 'Northeast',
    interests: ['Coast', 'Culture', 'Cities'],
    description: [
      'Boardwalk days, Victorian seaside streets, and easy city connections.',
      'วันสบายบนบอร์ดวอล์ก เมืองชายทะเลยุควิกตอเรียน และการเชื่อมต่อมหานคร',
    ],
    places: ['Cape May', 'Asbury Park', 'Liberty State Park'],
    season: ['Summer', 'Fall'],
    days: 3,
    food: ['Boardwalk pizza & saltwater taffy', 'พิซซ่าริมทะเลและซอลต์วอเตอร์แทฟฟี'],
    hub: 'EWR',
    tip: [
      'Check beach access rules and seasonal rail or bus schedules for shore towns.',
      'ตรวจข้อกำหนดชายหาดและตารางรถไฟหรือรถบัสตามฤดูกาล',
    ],
  },
  {
    code: 'NM',
    name: 'New Mexico',
    thai: 'นิวเม็กซิโก',
    region: 'Southwest',
    interests: ['Culture', 'Nature'],
    description: [
      'Adobe architecture, living artistic traditions, and white-sand horizons.',
      'สถาปัตยกรรมอะโดบี ศิลปะที่ยังมีชีวิต และขอบฟ้าทรายขาว',
    ],
    places: ['Santa Fe', 'White Sands National Park', 'Taos'],
    season: ['Spring', 'Fall'],
    days: 5,
    food: ['Red and green chile dishes', 'อาหารชิลีแดงและชิลีเขียว'],
    hub: 'ABQ',
    tip: [
      'Respect photography rules at Pueblo communities and check White Sands closure notices.',
      'เคารพกฎถ่ายภาพของชุมชนปวยโบล และตรวจประกาศปิดไวต์แซนด์ส',
    ],
  },
  {
    code: 'NC',
    name: 'North Carolina',
    thai: 'นอร์ทแคโรไลนา',
    region: 'Southeast',
    interests: ['Nature', 'Coast', 'Culture'],
    description: [
      'Go from Blue Ridge overlooks to Atlantic dunes, with creative towns along the way.',
      'จากจุดชมวิวบลูริดจ์สู่เนินทรายแอตแลนติก พร้อมเมืองสร้างสรรค์ระหว่างทาง',
    ],
    places: ['Asheville', 'Blue Ridge Parkway', 'Outer Banks'],
    season: ['Spring', 'Fall', 'Summer'],
    days: 6,
    food: ['Carolina barbecue & coastal seafood', 'บาร์บีคิวแคโรไลนาและอาหารทะเล'],
    hub: 'CLT / RDU / AVL',
    tip: [
      'Check parkway recovery work and road closures; mountains and coast are best planned as separate legs.',
      'ตรวจงานซ่อมและถนนปิดบนพาร์กเวย์ แบ่งทริปภูเขาและทะเลเป็นคนละช่วง',
    ],
  },
  {
    code: 'ND',
    name: 'North Dakota',
    thai: 'นอร์ทดาโคตา',
    region: 'Midwest',
    interests: ['Nature', 'Culture'],
    description: [
      'Quiet badlands, bison country, and open roads with room to breathe.',
      'แบดแลนด์อันสงบ ดินแดนไบซัน และถนนกว้างให้เดินทางอย่างผ่อนคลาย',
    ],
    places: ['Theodore Roosevelt National Park', 'Fargo', 'Bismarck'],
    season: ['Summer', 'Fall'],
    days: 4,
    food: ['Knoephla soup & regional comfort food', 'ซุปเนิฟลาและอาหารพื้นบ้าน'],
    hub: 'FAR / BIS',
    tip: [
      'The park’s units are separated by a long drive; choose a base to match the part you want to visit.',
      'พื้นที่อุทยานแต่ละส่วนห่างกันมาก เลือกฐานพักให้ตรงกับส่วนที่ต้องการเที่ยว',
    ],
  },
  {
    code: 'OH',
    name: 'Ohio',
    thai: 'โอไฮโอ',
    region: 'Midwest',
    interests: ['Cities', 'Culture', 'Nature'],
    description: [
      'Music history, inventive city neighborhoods, and green escapes close at hand.',
      'ประวัติศาสตร์ดนตรี ย่านเมืองสร้างสรรค์ และพื้นที่สีเขียวใกล้ตัว',
    ],
    places: ['Cleveland', 'Cincinnati', 'Hocking Hills State Park'],
    season: ['Summer', 'Fall'],
    days: 4,
    food: ['Cincinnati chili & local markets', 'ซินซินแนติชิลีและตลาดท้องถิ่น'],
    hub: 'CLE / CMH / CVG',
    tip: [
      'The major cities are spread out; pick a regional base for a short stay.',
      'เมืองหลักอยู่กระจายกัน ควรเลือกหนึ่งภูมิภาคหากมีเวลาเที่ยวสั้น',
    ],
  },
  {
    code: 'OK',
    name: 'Oklahoma',
    thai: 'โอคลาโฮมา',
    region: 'Southwest',
    interests: ['Culture', 'Nature'],
    description: [
      'Discover Native nations’ stories, Route 66 stops, and wide prairie landscapes.',
      'เรียนรู้เรื่องราวชนพื้นเมือง แวะ Route 66 และชมทุ่งหญ้ากว้าง',
    ],
    places: ['Oklahoma City', 'Tulsa', 'Wichita Mountains Wildlife Refuge'],
    season: ['Spring', 'Fall'],
    days: 4,
    food: ['Onion burgers & regional barbecue', 'ออเนียนเบอร์เกอร์และบาร์บีคิว'],
    hub: 'OKC / TUL',
    tip: [
      'Visit tribal cultural centers for locally told histories and check weather along your driving route.',
      'เรียนรู้ประวัติศาสตร์จากศูนย์วัฒนธรรมชนเผ่าและตรวจอากาศตามเส้นทางขับรถ',
    ],
  },
  {
    code: 'OR',
    name: 'Oregon',
    thai: 'ออริกอน',
    region: 'West',
    interests: ['Nature', 'Coast', 'Cities'],
    description: [
      'A little mist, a lot of green, and a coast that rewards every detour.',
      'หมอกบาง ป่าเขียว และชายฝั่งที่มีสิ่งน่าค้นหาทุกทางแยก',
    ],
    places: ['Portland', 'Cannon Beach', 'Crater Lake National Park'],
    season: ['Summer', 'Fall'],
    days: 5,
    food: ['Food carts & Pacific Northwest produce', 'ฟู้ดคาร์ตและผลผลิตแปซิฟิกนอร์ทเวสต์'],
    hub: 'PDX',
    tip: [
      'Check Crater Lake road openings and ocean tides before visiting beaches or tide pools.',
      'ตรวจถนนรอบเครเตอร์เลกและเวลาน้ำขึ้นลงก่อนเที่ยวหาดหรือแอ่งน้ำทะเล',
    ],
  },
  {
    code: 'PA',
    name: 'Pennsylvania',
    thai: 'เพนซิลเวเนีย',
    region: 'Northeast',
    interests: ['Culture', 'Cities', 'Nature'],
    description: [
      'Revolutionary landmarks, industrial reinvention, and leafy countryside.',
      'แลนด์มาร์กยุคปฏิวัติ เมืองอุตสาหกรรมที่เปลี่ยนโฉม และชนบทสีเขียว',
    ],
    places: ['Philadelphia', 'Pittsburgh', 'Gettysburg'],
    season: ['Spring', 'Fall'],
    days: 5,
    food: ['Cheesesteaks & Pennsylvania Dutch cooking', 'ชีสสเต๊กและอาหารเพนซิลเวเนียดัตช์'],
    hub: 'PHL / PIT',
    tip: [
      'Philadelphia and Pittsburgh are far apart; include a travel day if you want both.',
      'ฟิลาเดลเฟียและพิตต์สเบิร์กห่างกันมาก เผื่อวันเดินทางหากเที่ยวทั้งคู่',
    ],
  },
  {
    code: 'RI',
    name: 'Rhode Island',
    thai: 'โรดไอแลนด์',
    region: 'Northeast',
    interests: ['Coast', 'Culture'],
    description: [
      'Ocean views, creative Providence, and Newport’s grand seaside history.',
      'วิวทะเล โพรวิเดนซ์เมืองศิลปะ และประวัติศาสตร์ริมฝั่งนิวพอร์ต',
    ],
    places: ['Newport', 'Providence', 'Block Island'],
    season: ['Summer', 'Fall'],
    days: 3,
    food: ['Clam cakes & stuffies', 'แคลมเค้กและหอยอบยัดไส้'],
    hub: 'PVD',
    tip: [
      'Reserve island ferries in peak periods and check current access to the Cliff Walk.',
      'จองเรือไปเกาะช่วงยอดนิยมและตรวจการเข้าถึงเส้นทางคลิฟฟ์วอล์ก',
    ],
  },
  {
    code: 'SC',
    name: 'South Carolina',
    thai: 'เซาท์แคโรไลนา',
    region: 'Southeast',
    interests: ['Coast', 'Culture', 'Nature'],
    description: [
      'Lowcountry food, colorful harbor streets, and a forest alive with detail.',
      'อาหารโลว์คันทรี ถนนท่าเรือสีสันสดใส และผืนป่าที่เต็มไปด้วยชีวิต',
    ],
    places: ['Charleston', 'Hilton Head Island', 'Congaree National Park'],
    season: ['Spring', 'Fall'],
    days: 4,
    food: ['Shrimp and grits & Lowcountry dishes', 'กุ้งกับกริทส์และอาหารโลว์คันทรี'],
    hub: 'CHS',
    tip: [
      'Check water levels and boardwalk conditions at Congaree; pack for humidity and insects.',
      'ตรวจระดับน้ำและทางเดินที่คองการี พร้อมเตรียมรับความชื้นและแมลง',
    ],
  },
  {
    code: 'SD',
    name: 'South Dakota',
    thai: 'เซาท์ดาโคตา',
    region: 'Midwest',
    interests: ['Nature', 'Culture'],
    description: [
      'Layered badlands and pine-covered hills hold stories best explored slowly.',
      'แบดแลนด์เป็นชั้นและเนินเขาป่าสน เต็มไปด้วยเรื่องราวที่ควรค่อย ๆ สำรวจ',
    ],
    places: ['Badlands National Park', 'Custer State Park', 'Black Hills'],
    season: ['Summer', 'Fall'],
    days: 5,
    food: ['Regional ranch cooking & local produce', 'อาหารฟาร์มปศุสัตว์และผลผลิตท้องถิ่น'],
    hub: 'RAP',
    tip: [
      'Learn about the Black Hills’ significance to Lakota people and keep your distance from bison.',
      'เรียนรู้ความสำคัญของแบล็กฮิลส์ต่อชาวลาโกตาและรักษาระยะห่างจากไบซัน',
    ],
  },
  {
    code: 'TN',
    name: 'Tennessee',
    thai: 'เทนเนสซี',
    region: 'Southeast',
    interests: ['Culture', 'Cities', 'Nature'],
    description: [
      'Follow the music from Memphis to Nashville, then find your quiet in the Smokies.',
      'ตามเสียงดนตรีจากเมมฟิสสู่นแนชวิลล์ แล้วพักใจในเทือกเขาสโมกกี',
    ],
    places: ['Nashville', 'Memphis', 'Great Smoky Mountains National Park'],
    season: ['Spring', 'Fall'],
    days: 6,
    food: ['Hot chicken & Memphis barbecue', 'ฮอตชิกเกนและบาร์บีคิวเมมฟิส'],
    hub: 'BNA / MEM / TYS',
    tip: [
      'Tennessee stretches a long way east to west; split your trip into city and mountain bases.',
      'เทนเนสซีทอดยาวจากตะวันออกไปตะวันตก ควรแบ่งฐานพักช่วงเมืองและภูเขา',
    ],
  },
  {
    code: 'TX',
    name: 'Texas',
    thai: 'เท็กซัส',
    region: 'Southwest',
    interests: ['Cities', 'Culture', 'Nature'],
    description: [
      'Live music, generous flavors, and desert landscapes on a Texas-sized scale.',
      'ดนตรีสด อาหารรสเข้ม และทะเลทรายกว้างใหญ่ในขนาดแบบเท็กซัส',
    ],
    places: ['Austin', 'San Antonio', 'Big Bend National Park'],
    season: ['Spring', 'Fall'],
    days: 7,
    food: ['Texas barbecue & Tex-Mex', 'บาร์บีคิวเท็กซัสและเท็กซ์เม็กซ์'],
    hub: 'AUS / DFW / IAH',
    tip: [
      'Big Bend is remote. Plan fuel, water, accommodation, and the long drive separately from city time.',
      'บิกเบนด์อยู่ห่างไกล วางแผนน้ำมัน น้ำ ที่พัก และเวลาขับรถแยกจากช่วงเที่ยวเมือง',
    ],
  },
  {
    code: 'VT',
    name: 'Vermont',
    thai: 'เวอร์มอนต์',
    region: 'Northeast',
    interests: ['Nature', 'Culture'],
    description: [
      'Covered bridges, Green Mountain trails, and farm stands worth pulling over for.',
      'สะพานมีหลังคา เส้นทางกรีนเมาน์เทน และร้านผลผลิตฟาร์มที่น่าแวะ',
    ],
    places: ['Burlington', 'Stowe', 'Woodstock'],
    season: ['Fall', 'Summer', 'Winter'],
    days: 4,
    food: ['Maple syrup & artisan cheese', 'เมเปิลไซรัปและชีสท้องถิ่น'],
    hub: 'BTV',
    tip: [
      'Foliage timing varies each year and by elevation. Keep your scenic drive flexible.',
      'ใบไม้เปลี่ยนสีต่างกันในแต่ละปีและระดับความสูง ควรยืดหยุ่นเส้นทางชมวิว',
    ],
  },
  {
    code: 'VA',
    name: 'Virginia',
    thai: 'เวอร์จิเนีย',
    region: 'Southeast',
    interests: ['Culture', 'Nature', 'Coast'],
    description: [
      'Mountain drives, layered American history, and Atlantic shores in one state.',
      'ถนนบนภูเขา ประวัติศาสตร์หลายยุค และชายฝั่งแอตแลนติกในรัฐเดียว',
    ],
    places: ['Shenandoah National Park', 'Richmond', 'Colonial Williamsburg'],
    season: ['Spring', 'Fall'],
    days: 5,
    food: ['Chesapeake oysters & regional cooking', 'หอยนางรมเชซาพีกและอาหารท้องถิ่น'],
    hub: 'IAD / RIC',
    tip: [
      'Allow extra time for Skyline Drive’s slow scenic route and check weather-related closures.',
      'เผื่อเวลาขับสกายไลน์ไดรฟ์แบบชมวิว และตรวจถนนปิดจากสภาพอากาศ',
    ],
  },
  {
    code: 'WV',
    name: 'West Virginia',
    thai: 'เวสต์เวอร์จิเนีย',
    region: 'Southeast',
    interests: ['Nature', 'Culture'],
    description: [
      'River gorges, Appalachian trails, and mountain towns with a warm welcome.',
      'ช่องเขาแม่น้ำ เส้นทางแอปพาเลเชียน และเมืองภูเขาที่พร้อมต้อนรับ',
    ],
    places: ['New River Gorge National Park', 'Harpers Ferry', 'Dolly Sods'],
    season: ['Spring', 'Fall', 'Summer'],
    days: 4,
    food: ['Pepperoni rolls & Appalachian cooking', 'เปปเปอโรนีโรลและอาหารแอปพาเลเชียน'],
    hub: 'CRW',
    tip: [
      'Choose rafting trips to match your ability and check remote trail conditions before setting out.',
      'เลือกระดับทัวร์ล่องแก่งให้เหมาะกับทักษะ และตรวจเส้นทางห่างไกลก่อนออกเดิน',
    ],
  },
  {
    code: 'WI',
    name: 'Wisconsin',
    thai: 'วิสคอนซิน',
    region: 'Midwest',
    interests: ['Coast', 'Cities', 'Nature'],
    description: [
      'Great Lakes shorelines, laid-back cities, and a proud local food tradition.',
      'ชายฝั่งเกรตเลกส์ เมืองสบาย ๆ และวัฒนธรรมอาหารที่เป็นเอกลักษณ์',
    ],
    places: ['Milwaukee', 'Door County', 'Apostle Islands National Lakeshore'],
    season: ['Summer', 'Fall'],
    days: 4,
    food: ['Cheese curds & Friday fish fries', 'ชีสเคิร์ดและปลาทอดวันศุกร์'],
    hub: 'MKE / MSN',
    tip: [
      'Lake Superior conditions can change quickly; use qualified operators for sea-kayaking trips.',
      'สภาพทะเลสาบซูพีเรียเปลี่ยนเร็ว ใช้ผู้ให้บริการที่มีความชำนาญสำหรับทริปคายัก',
    ],
  },
  {
    code: 'WY',
    name: 'Wyoming',
    thai: 'ไวโอมิง',
    region: 'West',
    interests: ['Nature', 'Culture'],
    description: [
      'Geysers, jagged peaks, and wildlife-rich valleys make the journey feel enormous.',
      'ไกเซอร์ ยอดเขาคมชัด และหุบเขาที่มีสัตว์ป่า ทำให้ทุกการเดินทางยิ่งใหญ่',
    ],
    places: ['Yellowstone National Park', 'Grand Teton National Park', 'Cody'],
    season: ['Summer', 'Fall'],
    days: 6,
    food: ['Western ranch cooking & trout', 'อาหารฟาร์มตะวันตกและปลาเทราต์'],
    hub: 'JAC / COD',
    tip: [
      'Check park road seasons, stay on thermal boardwalks, and follow wildlife-distance rules.',
      'ตรวจฤดูกาลเปิดถนน เดินบนทางไม้บริเวณน้ำพุร้อน และรักษาระยะห่างจากสัตว์ป่า',
    ],
  },
];

export const stateName = (state: StateGuide, lang: Language) =>
  lang === 'th' ? state.thai : state.name;
export const tourismUrl = (state: StateGuide) =>
  `https://www.visittheusa.com/destinations/${state.name.toLowerCase().replace(/ /g, '-')}/`;
export interface TripStop {
  code: string;
  days: number;
  notes: string;
}
export interface Trip {
  name: string;
  startDate: string;
  travelers: number;
  dailyBudget: number;
  stops: TripStop[];
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
    image: '',
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
