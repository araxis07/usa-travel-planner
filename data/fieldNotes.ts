import type { LocalText } from './travel';
interface FieldNote {
  id: string;
  icon: string;
  category: LocalText;
  title: LocalText;
  intro: LocalText;
  sections: { title: LocalText; text: LocalText }[];
  sources: { name: string; url: string }[];
}
export const MORE_GUIDES: FieldNote[] = [
  {
    id: 'car-free',
    icon: 'city',
    category: ['GETTING AROUND', 'การเดินทาง', '交通出行', '移動のヒント', '교통 안내'],
    title: [
      'A city break without a car',
      'เที่ยวเมืองโดยไม่ต้องขับรถ',
      '不自驾的城市假期',
      '車なしで楽しむ街の旅',
      '차 없이 즐기는 도시 여행',
    ],
    intro: [
      'Choose your base around the journeys you will actually make. Plan the last mile as carefully as the flight.',
      'เลือกฐานพักตามเส้นทางที่จะใช้จริง และวางแผนช่วงสุดท้ายจากสถานีให้ละเอียดพอ ๆ กับเที่ยวบิน',
      '根据实际出行路线选择住宿，认真规划从车站到目的地的最后一段路。',
      '実際に移動する経路を考えて宿を選び、駅から目的地までの道も計画しましょう。',
      '실제로 이용할 경로를 중심으로 숙소를 고르고, 역에서 목적지까지의 마지막 구간도 계획하세요.',
    ],
    sections: [
      {
        title: [
          'Pick one useful neighborhood',
          'เลือกย่านที่เดินทางสะดวก',
          '选择方便的街区',
          '便利な街区を選ぶ',
          '이동이 편리한 동네 선택',
        ],
        text: [
          'Put your accommodation and the main places you want to visit on a map. Compare transfers, walking distance and the return journey after your last activity. The transit-friendly filter identifies starting bases, not every street or attraction.',
          'ปักที่พักและสถานที่หลักบนแผนที่ เทียบจำนวนครั้งที่ต่อรถ ระยะเดิน และการกลับหลังจบกิจกรรม ตัวกรองขนส่งสาธารณะช่วยเลือกฐานเที่ยว ไม่ได้หมายความว่าทุกถนนหรือสถานที่เดินทางสะดวกเท่ากัน',
          '把住宿和主要景点放到地图上，比较换乘、步行和晚间返程。公共交通标签用于选择据点，并不覆盖每条街或每个景点。',
          '宿と主な行き先を地図に置き、乗り換え・徒歩・帰路を比べましょう。公共交通の分類は拠点選びの目安で、全施設への便利さを示すものではありません。',
          '숙소와 주요 명소를 지도에 표시하고 환승, 도보, 마지막 활동 후 귀가 경로를 비교하세요. 대중교통 표시는 거점 선택 기준이며 모든 명소에 해당하지는 않습니다.',
        ],
      },
      {
        title: [
          'Use the operator’s current guide',
          'เปิดคู่มือผู้ให้บริการล่าสุด',
          '查看运营方最新指南',
          '運営者の最新案内を見る',
          '운영 기관의 최신 안내 확인',
        ],
        text: [
          'San Francisco’s SFMTA, New York’s MTA and Chicago’s CTA publish trip-planning and rider guides. Check the service you need, payment options and accessibility information directly; do not assume another city uses the same system.',
          'SFMTA ของซานฟรานซิสโก MTA ของนิวยอร์ก และ CTA ของชิคาโกมีคู่มือวางแผนและการโดยสาร ตรวจสายที่ใช้ วิธีชำระเงิน และการเข้าถึงจากผู้ให้บริการแต่ละเมืองโดยตรง',
          '旧金山SFMTA、纽约MTA和芝加哥CTA提供路线规划与乘车指南。分别核对线路、支付方式和无障碍信息，不要假设各城市系统相同。',
          'SFMTA、MTA、CTAは経路や乗り方の案内を公開しています。路線・支払い・アクセシビリティを各都市の運営者で確認しましょう。',
          '샌프란시스코 SFMTA, 뉴욕 MTA, 시카고 CTA는 경로 및 이용 안내를 제공합니다. 노선과 결제, 접근성 정보를 각 운영 기관에서 확인하세요.',
        ],
      },
      {
        title: [
          'Give intercity travel its own space',
          'เผื่อเวลาสำหรับย้ายเมือง',
          '为城际交通留出时间',
          '都市間の移動にも余裕を',
          '도시 간 이동 시간 확보',
        ],
        text: [
          'Compare the full door-to-door journey for rail, bus or flight. Include terminal access, luggage and check-in time, then keep the arrival day flexible. Save the booking reference in your trip notes.',
          'เทียบเวลาตั้งแต่ออกจากที่พักจนถึงปลายทางของรถไฟ รถบัส หรือเครื่องบิน รวมการไปสถานี สัมภาระ และเวลาเช็กอิน เผื่อวันมาถึงให้ยืดหยุ่นและเก็บเลขการจองในโน้ตทริป',
          '比较火车、巴士或航班的全程时间，包括前往车站、行李和办理手续。抵达当天保持弹性，并保存预订编号。',
          '鉄道・バス・飛行機は玄関から玄関までの時間で比較。駅への移動や荷物、手続きを含め、到着日は余裕を残しましょう。',
          '철도, 버스, 항공편은 숙소에서 목적지까지의 전체 시간으로 비교하세요. 터미널 이동과 수하물, 체크인 시간을 포함하고 도착일은 여유롭게 잡으세요.',
        ],
      },
    ],
    sources: [
      { name: 'SFMTA', url: 'https://www.sfmta.com/getting-around-san-francisco' },
      { name: 'MTA', url: 'https://www.mta.info/guides/riding-the-subway' },
      { name: 'CTA', url: 'https://www.transitchicago.com/howto/' },
      { name: 'Amtrak', url: 'https://www.amtrak.com/planning-booking' },
    ],
  },
  {
    id: 'season-planning',
    icon: 'sun',
    category: ['THE SEASONS', 'ฤดูกาลท่องเที่ยว', '季节规划', '季節の計画', '계절별 계획'],
    title: [
      'Let the season shape your route',
      'วางเส้นทางให้เข้ากับฤดูกาล',
      '让季节决定路线',
      '季節に合わせて旅を組む',
      '계절에 맞춰 경로 정하기',
    ],
    intro: [
      'A month is a starting point. Elevation, coastline and local conditions can change the experience within the same state.',
      'เดือนเดินทางเป็นเพียงจุดเริ่มต้น ความสูง ชายฝั่ง และสภาพท้องถิ่นทำให้ประสบการณ์ในรัฐเดียวกันต่างกันได้',
      '月份只是起点，海拔、海岸与当地条件会让同一州的体验也很不同。',
      '月はあくまで目安。同じ州でも標高や海岸、現地の状況で体験は変わります。',
      '여행 월은 출발점일 뿐입니다. 같은 주에서도 고도와 해안, 현지 상황에 따라 경험이 달라집니다.',
    ],
    sections: [
      {
        title: [
          'Choose the experience first',
          'เลือกประสบการณ์ที่อยากได้ก่อน',
          '先确定想要的体验',
          '体験から選ぶ',
          '원하는 경험부터 선택',
        ],
        text: [
          'Decide whether the priority is a city neighborhood, a beach, an accessible viewpoint or a particular trail. Use the suggested months to narrow the search, then check the specific place rather than relying on a state-wide season label.',
          'เลือกก่อนว่าอยากเดินย่านเมือง เที่ยวชายหาด ชมวิวที่เข้าถึงสะดวก หรือเดินเส้นทางใด ใช้เดือนแนะนำช่วยคัดตัวเลือก แล้วตรวจสถานที่จริงแทนการอิงฤดูกาลระดับรัฐอย่างเดียว',
          '先确定城市街区、海滩、方便到达的观景点或具体步道。用建议月份缩小范围，再核对实际地点。',
          '街歩き、ビーチ、展望台、特定の登山道など目的を決め、月の目安で絞った後に各場所を確認しましょう。',
          '도시 산책, 해변, 접근하기 편한 전망대 또는 특정 탐방로 중 우선순위를 정하세요. 추천 월로 후보를 좁힌 뒤 해당 장소를 확인하세요.',
        ],
      },
      {
        title: [
          'Check roads and local notices',
          'ตรวจถนนและประกาศพื้นที่',
          '核对道路与当地公告',
          '道路と現地の告知を確認',
          '도로 및 현지 공지 확인',
        ],
        text: [
          'Check the land manager’s access page and local forecast close to departure. Park roads, shuttle services and facilities can have different operating seasons. Cached facts on Roam show their retrieval date; follow the source link for current details.',
          'ตรวจหน้าการเข้าถึงของผู้ดูแลพื้นที่และพยากรณ์ใกล้วันเดินทาง ถนนอุทยาน รถรับส่ง และสิ่งอำนวยความสะดวกอาจเปิดคนละช่วง ข้อมูลที่เก็บไว้ใน Roam มีวันที่ดึงข้อมูลและลิงก์ต้นทางสำหรับตรวจล่าสุด',
          '临近出发时查看管理方的开放说明和天气预报。道路、接驳车与设施的运营季节可能不同。Roam缓存信息标有获取日期，请通过来源链接确认最新详情。',
          '出発前に管理者のアクセス案内と天気予報を確認。道路・シャトル・施設の営業時期は異なることがあります。保存情報には取得日を表示しています。',
          '출발이 가까워지면 관리 기관의 접근 안내와 예보를 확인하세요. 도로, 셔틀, 시설의 운영 시기는 다를 수 있습니다. Roam의 저장 정보에는 조회 날짜가 표시됩니다.',
        ],
      },
      {
        title: [
          'Keep an alternative day',
          'เตรียมวันเที่ยวทางเลือก',
          '准备备选安排',
          '別の過ごし方も用意',
          '대체 일정 준비',
        ],
        text: [
          'Save an indoor option or a rest day in the same area. Duplicate your trip to compare two versions, and move activities between days when the conditions change. A flexible plan gives you choices without rebuilding everything.',
          'เก็บตัวเลือกในร่มหรือวันพักในพื้นที่เดียวกัน ทำสำเนาทริปเพื่อเทียบสองแบบ และย้ายกิจกรรมข้ามวันเมื่อสภาพเปลี่ยน จะได้ปรับแผนโดยไม่ต้องเริ่มใหม่ทั้งหมด',
          '在同一区域保存室内选择或休息日。复制行程比较方案，条件变化时调整活动日期，无需从头规划。',
          '同じ地域で屋内の選択肢や休息日を用意。旅を複製して比較し、状況に合わせて予定を別の日へ移せます。',
          '같은 지역의 실내 활동이나 휴식일을 저장하세요. 여행을 복제해 두 안을 비교하고 상황이 바뀌면 활동을 다른 날로 옮길 수 있습니다.',
        ],
      },
    ],
    sources: [
      { name: 'National Weather Service', url: 'https://www.weather.gov/safety/' },
      {
        name: 'NPS trip planning',
        url: 'https://www.nps.gov/subjects/healthandsafety/trip-planning-guide.htm',
      },
    ],
  },
  {
    id: 'comfortable-days',
    icon: 'compass',
    category: ['TRAVEL TOGETHER', 'เที่ยวด้วยกัน', '结伴出游', '一緒に旅する', '함께 여행하기'],
    title: [
      'Build a day everyone can enjoy',
      'จัดวันเที่ยวให้ทุกคนสนุกได้',
      '安排人人都能享受的一天',
      'みんなで楽しめる一日を',
      '모두가 즐길 수 있는 하루',
    ],
    intro: [
      'Start with your group’s pace. A satisfying day can be one memorable visit with plenty of time between activities.',
      'เริ่มจากจังหวะของคนในทริป วันเที่ยวที่ดีอาจมีเพียงจุดหมายประทับใจหนึ่งแห่งพร้อมเวลาพักระหว่างกิจกรรม',
      '从同行者的节奏出发，一次难忘的游览加上充足休息，就能构成美好的一天。',
      '同行者のペースを大切に。印象に残るひとつの訪問と十分な休憩で、充実した一日になります。',
      '동행자의 속도에 맞춰 시작하세요. 기억에 남는 한 번의 방문과 충분한 휴식만으로도 좋은 하루가 됩니다.',
    ],
    sections: [
      {
        title: [
          'Ask about the exact route',
          'ตรวจเส้นทางที่จะใช้จริง',
          '核对具体路线',
          '実際の経路を確認',
          '실제로 이용할 경로 확인',
        ],
        text: [
          'Accessibility varies within a destination. Ask the venue about surfaces, gradients, steps, accessible toilets and transport for the route you plan to use. A general city or park description cannot establish whether a specific visit will meet your needs.',
          'การเข้าถึงแตกต่างกันในแต่ละส่วนของสถานที่ สอบถามพื้นผิว ความชัน บันได ห้องน้ำ และรถรับส่งของเส้นทางที่จะใช้จริง คำอธิบายภาพรวมของเมืองหรืออุทยานไม่เพียงพอสำหรับตัดสินทุกความต้องการ',
          '同一目的地的无障碍条件也会不同。请询问实际路线的路面、坡度、台阶、卫生间与交通，不能仅依赖整体介绍。',
          '同じ場所でもアクセシビリティは異なります。利用する経路の路面・勾配・段差・トイレ・交通を運営者に確認してください。',
          '같은 목적지 안에서도 접근성은 다릅니다. 이용할 경로의 노면, 경사, 계단, 화장실과 교통편을 운영 기관에 문의하세요.',
        ],
      },
      {
        title: [
          'Make breaks part of the plan',
          'ใส่เวลาพักไว้ในแผน',
          '把休息纳入行程',
          '休憩も予定に入れる',
          '휴식도 일정에 포함',
        ],
        text: [
          'Add meal breaks and flexible time alongside the main activities. Use the daily timeline to spot overlaps. Travel buffers are your own estimates; calculate the road route separately when driving and adjust for the needs of the group.',
          'ใส่เวลารับประทานอาหารและเวลายืดหยุ่นควบคู่กิจกรรมหลัก ใช้ไทม์ไลน์ตรวจเวลาทับซ้อน เวลาเผื่อเป็นค่าที่คุณตั้งเอง หากขับรถให้คำนวณเส้นทางแยกแล้วปรับตามคนในทริป',
          '在主要活动之间加入用餐和自由时间，通过时间轴检查冲突。预留时间是个人估计，自驾时请另行计算路线并按同行者需要调整。',
          '食事や自由時間も入れ、時間の重なりを確認しましょう。余裕時間は自分の見積もりです。運転する場合は道路経路も確認してください。',
          '주요 활동 사이에 식사와 자유 시간을 넣고 타임라인으로 겹치는 일정을 확인하세요. 여유 시간은 직접 정한 값이므로 운전 시 경로를 별도로 계산해 조정하세요.',
        ],
      },
      {
        title: [
          'Share a useful offline copy',
          'เก็บสำเนาที่เปิดดูง่าย',
          '保存实用的离线副本',
          '使いやすい控えを保存',
          '유용한 오프라인 사본 저장',
        ],
        text: [
          'Print or save a PDF with the day’s activities and useful notes. Download photos before leaving a connection, and keep booking references accessible. Online map tiles and driving calculations still need internet access.',
          'พิมพ์หรือบันทึก PDF ที่มีกิจกรรมและโน้ตสำคัญ ดาวน์โหลดภาพก่อนออกจากพื้นที่มีอินเทอร์เน็ต และเก็บเลขการจองให้เปิดดูง่าย ภาพแผนที่ออนไลน์และการคำนวณเส้นทางยังต้องเชื่อมต่อ',
          '打印或保存包含活动与备注的PDF，联网时下载照片，并随身保存预订编号。在线地图与路线计算仍需网络。',
          '予定とメモを印刷またはPDF保存し、接続中に写真をダウンロード。予約番号も手元に。オンライン地図と経路計算には接続が必要です。',
          '활동과 메모가 담긴 PDF를 저장하거나 인쇄하고, 인터넷에 연결되어 있을 때 사진을 내려받으세요. 온라인 지도와 경로 계산에는 인터넷이 필요합니다.',
        ],
      },
    ],
    sources: [
      {
        name: 'NPS accessibility',
        url: 'https://www.nps.gov/subjects/accessibility/plan-your-visit.htm',
      },
      {
        name: 'NPS trip planning',
        url: 'https://www.nps.gov/subjects/healthandsafety/trip-planning-guide.htm',
      },
    ],
  },
];
