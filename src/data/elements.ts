import { PeriodicElement, ElementCategory } from '../types';

export const ELEMENTS: PeriodicElement[] = [
  // ==========================================
  // หมู่ 1 (1A): ไฮโดรเจน & โลหะแอลคาไล (Alkali Metals)
  // ==========================================
  {
    symbol: "H",
    nameTH: "ไฮโดรเจน",
    nameEN: "Hydrogen",
    atomicNumber: 1,
    group: 1,
    period: 1,
    category: "nonmetal",
    hint: "ธาตุที่เบาที่สุดในเอกภพ",
    trivia: "ธาตุที่มีความอุดมสมบูรณ์ที่สุดในจักรวาล เป็นเชื้อเพลิงปฏิกิริยานิวเคลียร์ฟิวชันของดวงอาทิตย์",
    atomicMass: 1.008
  },
  {
    symbol: "Li",
    nameTH: "ลิเทียม",
    nameEN: "Lithium",
    atomicNumber: 3,
    group: 1,
    period: 2,
    category: "alkali-metal",
    hint: "โลหะเบาที่สุด ใช้ทำแบตเตอรี่",
    trivia: "โลหะที่มีความหนาแน่นต่ำที่สุด ลอยน้ำได้ นิยมใช้ทำแบตเตอรี่ลิเทียมไอออนในสมาร์ตโฟนและรถ EV",
    atomicMass: 6.94
  },
  {
    symbol: "Na",
    nameTH: "โซเดียม",
    nameEN: "Sodium",
    atomicNumber: 11,
    group: 1,
    period: 3,
    category: "alkali-metal",
    hint: "พบมากในเกลือแกง (NaCl)",
    trivia: "โลหะเนื้ออ่อนหั่นด้วยมีดได้ ทำปฏิกิริยารุนแรงกับน้ำจนเกิดเปลวไฟสีเหลืองเข้ม เป็นแร่ธาตุสำคัญในร่างกาย",
    atomicMass: 22.99
  },
  {
    symbol: "K",
    nameTH: "โพแทสเซียม",
    nameEN: "Potassium",
    atomicNumber: 19,
    group: 1,
    period: 4,
    category: "alkali-metal",
    hint: "แร่ธาตุสำคัญในกล้วยและปุ๋ยเคมี",
    trivia: "เผาไหม้ให้เปลวไฟสีม่วงสวยงาม เป็นสารอาหารสำคัญต่อระบบกล้ามเนื้อ หัวใจ และพืชพรรณ",
    atomicMass: 39.10
  },
  {
    symbol: "Rb",
    nameTH: "รูบิเดียม",
    nameEN: "Rubidium",
    atomicNumber: 37,
    group: 1,
    period: 5,
    category: "alkali-metal",
    hint: "ลุกติดไฟได้เองเมื่อสัมผัสอากาศ",
    trivia: "โลหะแอลคาไลที่ว่องไวอย่างยิ่ง ลุกติดไฟเองในอากาศได้ ให้เปลวไฟสีม่วงแดงสด",
    atomicMass: 85.47
  },
  {
    symbol: "Cs",
    nameTH: "ซีเซียม",
    nameEN: "Cesium",
    atomicNumber: 55,
    group: 1,
    period: 6,
    category: "alkali-metal",
    hint: "ใช้กำหนดมาตรฐานเวลานาฬิกาอะตอม",
    trivia: "โลหะสีทองอ่อนที่มีจุดหลอมเหลวต่ำ 28.5°C การสั่นพ้องของอะตอมซีเซียม-133 ถูกใช้เป็นนิยามมาตรฐานสากลของ 1 วินาที",
    atomicMass: 132.91
  },
  {
    symbol: "Fr",
    nameTH: "แฟรนเซียม",
    nameEN: "Francium",
    atomicNumber: 87,
    group: 1,
    period: 7,
    category: "alkali-metal",
    hint: "ธาตุกัมมันตรังสีหายากที่สุดในธรรมชาติ",
    trivia: "ธาตุธรรมชาติที่หายากเป็นอันดับสองบนเปลือกโลก มีสมบัติกัมมันตรังสีและสลายตัวเร็วมาก",
    atomicMass: 223.0
  },

  // ==========================================
  // หมู่ 2 (2A): โลหะแอลคาไลน์เอิร์ท (Alkaline Earth Metals)
  // ==========================================
  {
    symbol: "Be",
    nameTH: "เบริลเลียม",
    nameEN: "Beryllium",
    atomicNumber: 4,
    group: 2,
    period: 2,
    category: "alkaline-earth-metal",
    hint: "โลหะเบา แข็งแกร่ง ใช้ในยานอวกาศ",
    trivia: "โลหะน้ำหนักเบาแต่จุดหลอมเหลวสูง ทนทานต่อการขยายตัว นิยมใช้ทำกระจกกล้องโทรทรรศน์อวกาศเจมส์ เวบบ์",
    atomicMass: 9.012
  },
  {
    symbol: "Mg",
    nameTH: "แมกนีเซียม",
    nameEN: "Magnesium",
    atomicNumber: 12,
    group: 2,
    period: 3,
    category: "alkaline-earth-metal",
    hint: "ศูนย์กลางโมเลกุลคลอโรฟิลล์",
    trivia: "เผาไหม้แล้วให้แสงสีขาวสว่างจ้าตาพร่า เป็นธาตุแกนกลางของคลอโรฟิลล์ที่ช่วยให้พืชสร้างอาหารด้วยการสังเคราะห์แสง",
    atomicMass: 24.31
  },
  {
    symbol: "Ca",
    nameTH: "แคลเซียม",
    nameEN: "Calcium",
    atomicNumber: 20,
    group: 2,
    period: 4,
    category: "alkaline-earth-metal",
    hint: "องค์ประกอบหลักของกระดูกและฟัน",
    trivia: "แร่ธาตุที่มีปริมาณมากที่สุดในร่างกายมนุษย์ สร้างความแข็งแกร่งให้กระดูก ฟัน และเปลือกหอย",
    atomicMass: 40.08
  },
  {
    symbol: "Sr",
    nameTH: "สตรอนเชียม",
    nameEN: "Strontium",
    atomicNumber: 38,
    group: 2,
    period: 5,
    category: "alkaline-earth-metal",
    hint: "ให้เปลวไฟสีแดงสดใสในพลุไฟ",
    trivia: "สารประกอบสตรอนเชียมเมื่อถูกเผาไหม้จะให้แสงสีแดงสดสว่างเจิดจ้า จึงเป็นหัวใจสำคัญของพลุและดอกไม้ไฟ",
    atomicMass: 87.62
  },
  {
    symbol: "Ba",
    nameTH: "แบเรียม",
    nameEN: "Barium",
    atomicNumber: 56,
    group: 2,
    period: 6,
    category: "alkaline-earth-metal",
    hint: "สารทึบรังสีเอกซ์ตรวจทางเดินอาหาร",
    trivia: "แบเรียมซัลเฟตไม่ละลายน้ำและปลอดภัย ใช้ให้ผู้ป่วยดื่มเป็นสารทึบรังสีเอกซ์ (Barium meal) เพื่อเอกซเรย์ตรวจกระเพาะอาหาร",
    atomicMass: 137.33
  },
  {
    symbol: "Ra",
    nameTH: "เรเดียม",
    nameEN: "Radium",
    atomicNumber: 88,
    group: 2,
    period: 7,
    category: "alkaline-earth-metal",
    hint: "ธาตุกัมมันตรังสี ค้นพบโดยมารี กูรี",
    trivia: "ค้นพบโดยมารีและปิแอร์ กูรี เรืองแสงสีฟ้าอ่อนในที่มืด อดีตเคยใช้ทาหน้าปัดนาฬิกาให้เรืองแสง",
    atomicMass: 226.0
  },

  // ==========================================
  // หมู่ 13 (3A): หมู่โบรอน (Boron Group)
  // ==========================================
  {
    symbol: "B",
    nameTH: "โบรอน",
    nameEN: "Boron",
    atomicNumber: 5,
    group: 13,
    period: 2,
    category: "metalloid",
    hint: "ใช้ทำแก้วทนความร้อนสูง (Pyrex)",
    trivia: "กึ่งโลหะสีดำเงา มีความแข็งสูงมาก ใช้ผลิตแก้วโบโรซิลิเกตที่ทนทานต่อการเปลี่ยนแปลงอุณหภูมิอย่างฉับพลัน",
    atomicMass: 10.81
  },
  {
    symbol: "Al",
    nameTH: "อะลูมิเนียม",
    nameEN: "Aluminium",
    atomicNumber: 13,
    group: 13,
    period: 3,
    category: "post-transition-metal",
    hint: "โลหะเบา ไม่ขึ้นสนิม ทำกระป๋องและฟอยล์",
    trivia: "โลหะที่มีมากที่สุดในเปลือกโลก มีฟิล์มออกไซด์ป้องกันสนิม นำความร้อนและกระแสไฟฟ้าได้ดีเลิศ",
    atomicMass: 26.98
  },
  {
    symbol: "Ga",
    nameTH: "แกลเลียม",
    nameEN: "Gallium",
    atomicNumber: 31,
    group: 13,
    period: 4,
    category: "post-transition-metal",
    hint: "ละลายเป็นของเหลวได้บนฝ่ามือ",
    trivia: "มีจุดหลอมเหลวเพียง 29.76°C จึงละลายกลายเป็นของเหลวสีเงินวาวเมื่อวางบนฝ่ามือ และเป็นสารกึ่งตัวนำในหลอด LED",
    atomicMass: 69.72
  },
  {
    symbol: "In",
    nameTH: "อินเดียม",
    nameEN: "Indium",
    atomicNumber: 49,
    group: 13,
    period: 5,
    category: "post-transition-metal",
    hint: "ใช้ทำจอสัมผัสสมาร์ตโฟน (ITO)",
    trivia: "อินเดียมทินออกไซด์ (ITO) เป็นสารโปร่งใสที่นำไฟฟ้าได้ จึงถูกใช้เป็นชั้นเซนเซอร์ตรวจจับการสัมผัสในหน้าจอสมาร์ตโฟนทุกเครื่อง",
    atomicMass: 114.82
  },
  {
    symbol: "Tl",
    nameTH: "แทลเลียม",
    nameEN: "Thallium",
    atomicNumber: 81,
    group: 13,
    period: 6,
    category: "post-transition-metal",
    hint: "โลหะพิษร้ายแรงในอดีต",
    trivia: "โลหะเนื้ออ่อนสีเทา ไร้รสและไร้กลิ่น สารประกอบแทลเลียมมีพิษร้ายแรงสูงมากจนเคยได้ฉายาว่ายาพิษของนักลอบสังหาร",
    atomicMass: 204.38
  },

  // ==========================================
  // หมู่ 14 (4A): หมู่คาร์บอน (Carbon Group)
  // ==========================================
  {
    symbol: "C",
    nameTH: "คาร์บอน",
    nameEN: "Carbon",
    atomicNumber: 6,
    group: 14,
    period: 2,
    category: "nonmetal",
    hint: "รากฐานสิ่งมีชีวิต อัญรูปคือเพชรและแกรไฟต์",
    trivia: "หัวใจของเคมีอินทรีย์ สามารถสร้างพันธะโควาเลนต์ได้ 4 แขน มีอัญรูปมหัศจรรย์ทั้งไส้ดินสอดำและเพชรที่แข็งแกร่งที่สุด",
    atomicMass: 12.011
  },
  {
    symbol: "Si",
    nameTH: "ซิลิคอน",
    nameEN: "Silicon",
    atomicNumber: 14,
    group: 14,
    period: 3,
    category: "metalloid",
    hint: "สารกึ่งตัวนำหัวใจของชิปและโซลาร์เซลล์",
    trivia: "กึ่งโลหะที่พบมากเป็นอันดับสองในเปลือกโลก (ในรูปของทรายและหินควอตซ์) เป็นรากฐานของยุคคอมพิวเตอร์และซิลิคอนวัลเลย์",
    atomicMass: 28.085
  },
  {
    symbol: "Ge",
    nameTH: "เจอร์เมเนียม",
    nameEN: "Germanium",
    atomicNumber: 32,
    group: 14,
    period: 4,
    category: "metalloid",
    hint: "ใช้ทำเลนส์กล้องตรวจจับความร้อนอินฟราเรด",
    trivia: "สารกึ่งตัวนำสำคัญที่โปร่งแสงต่อรังสีอินฟราเรด จึงนิยมใช้ทำเลนส์ของกล้องตรวจจับความร้อนและไฟเบอร์ออปติก",
    atomicMass: 72.63
  },
  {
    symbol: "Sn",
    nameTH: "ดีบุก",
    nameEN: "Tin",
    atomicNumber: 50,
    group: 14,
    period: 5,
    category: "post-transition-metal",
    hint: "ใช้เคลือบกระป๋องอาหารและบัดกรี",
    trivia: "โลหะสีเงินวาวที่ไม่เป็นสนิม ใช้เคลือบผิวเหล็กทำกระป๋องบรรจุอาหาร และเมื่อดัดงอจะมีเสียงร้องที่เรียกว่า Tin Cry",
    atomicMass: 118.71
  },
  {
    symbol: "Pb",
    nameTH: "ตะกั่ว",
    nameEN: "Lead",
    atomicNumber: 82,
    group: 14,
    period: 6,
    category: "post-transition-metal",
    hint: "โลหะหนักความหนาแน่นสูง กั้นรังสีเอกซ์",
    trivia: "โลหะหนักที่มีจุดหลอมเหลวต่ำ ดูดกลืนรังสีเอกซ์และรังสีแกมมาได้ดีเยี่ยม จึงใช้ทำเสื้อเกราะตะกั่วในห้องเอกซเรย์",
    atomicMass: 207.2
  },

  // ==========================================
  // หมู่ 15 (5A): หมู่ไนโตรเจน (Pnictogens)
  // ==========================================
  {
    symbol: "N",
    nameTH: "ไนโตรเจน",
    nameEN: "Nitrogen",
    atomicNumber: 7,
    group: 15,
    period: 2,
    category: "nonmetal",
    hint: "ครองพื้นที่ 78% ในบรรยากาศโลก",
    trivia: "แก๊สที่พบมากที่สุดในอากาศโลก ช่วยเจือจางความเข้มข้นของออกซิเจน ไนโตรเจนเหลวมีอุณหภูมิเย็นจัดถึง -196°C",
    atomicMass: 14.007
  },
  {
    symbol: "P",
    nameTH: "ฟอสฟอรัส",
    nameEN: "Phosphorus",
    atomicNumber: 15,
    group: 15,
    period: 3,
    category: "nonmetal",
    hint: "องค์ประกอบ DNA และหัวไม้ขีดไฟ",
    trivia: "เป็นแกนหลักของโครงสร้างโมเลกุล DNA, RNA และ ATP ที่เก็บพลังงานในเซลล์ ฟอสฟอรัสแดงใช้ทำหัวไม้ขีดไฟ",
    atomicMass: 30.974
  },
  {
    symbol: "As",
    nameTH: "สารหนู",
    nameEN: "Arsenic",
    atomicNumber: 33,
    group: 15,
    period: 4,
    category: "metalloid",
    hint: "กึ่งโลหะพิษร้ายแรงในประวัติศาสตร์",
    trivia: "กึ่งโลหะที่มีพิษสะสม ยับยั้งกระบวนการหายใจระดับเซลล์ ในประวัติศาสตร์ยุคกลางมักถูกขนานนามว่าเป็นราชาแห่งยาพิษ",
    atomicMass: 74.922
  },
  {
    symbol: "Sb",
    nameTH: "พลวง",
    nameEN: "Antimony",
    atomicNumber: 51,
    group: 15,
    period: 5,
    category: "metalloid",
    hint: "สารหน่วงการติดไฟในพลาสติกและผ้า",
    trivia: "กึ่งโลหะสีเงินวาว สารประกอบแอนติโมนีไตรออกไซด์ถูกใส่ในพลาสติก สิ่งทอ และเบาะรถยนต์เพื่อหน่วงการลุกลามของไฟ",
    atomicMass: 121.76
  },
  {
    symbol: "Bi",
    nameTH: "บิสมัท",
    nameEN: "Bismuth",
    atomicNumber: 83,
    group: 15,
    period: 6,
    category: "post-transition-metal",
    hint: "ผลึกสีรุ้งสวยงาม ใช้ในยาลดกรดเคลือบกระเพาะ",
    trivia: "โลหะหลังทรานซิชันที่ผลึกบริสุทธิ์สร้างฟิล์มออกไซด์สะท้อนแสงสีรุ้ง และสารประกอบบิสมัทซับซาลิไซเลตใช้ในยาลดกรดเคลือบกระเพาะอาหาร",
    atomicMass: 208.98
  },

  // ==========================================
  // หมู่ 16 (6A): หมู่ออกซิเจน (Chalcogens)
  // ==========================================
  {
    symbol: "O",
    nameTH: "ออกซิเจน",
    nameEN: "Oxygen",
    atomicNumber: 8,
    group: 16,
    period: 2,
    category: "nonmetal",
    hint: "จำเป็นต่อการหายใจและการเผาไหม้",
    trivia: "แก๊สที่สิ่งมีชีวิตใช้สร้างพลังงาน เป็น 21% ของบรรยากาศโลก และในรูปโอโซน (O3) ช่วยกรองรังสี UV จากดวงอาทิตย์",
    atomicMass: 15.999
  },
  {
    symbol: "S",
    nameTH: "กำมะถัน (ซัลเฟอร์)",
    nameEN: "Sulfur",
    atomicNumber: 16,
    group: 16,
    period: 3,
    category: "nonmetal",
    hint: "ของแข็งสีเหลือง กลิ่นเฉพาะตัวในน้ำพุร้อน",
    trivia: "ของแข็งสีเหลืองรอบปล่องภูเขาไฟ ใช้ผลิตกรดซัลฟิวริก (กรดกำมะถัน) ซึ่งเป็นสารเคมีอุตสาหกรรมที่ผลิตมากที่สุดในโลก",
    atomicMass: 32.06
  },
  {
    symbol: "Se",
    nameTH: "ซีลีเนียม",
    nameEN: "Selenium",
    atomicNumber: 34,
    group: 16,
    period: 4,
    category: "nonmetal",
    hint: "นำไฟฟ้าได้ดีขึ้นเมื่อโดนแสง (เครื่องถ่ายเอกสาร)",
    trivia: "มีสมบัตินำไฟฟ้าไวต่อแสง (Photoconductivity) นิยมใช้ในดรัมของเครื่องถ่ายเอกสารและเซลล์รับแสง",
    atomicMass: 78.971
  },
  {
    symbol: "Te",
    nameTH: "เทลลูเรียม",
    nameEN: "Tellurium",
    atomicNumber: 52,
    group: 16,
    period: 5,
    category: "metalloid",
    hint: "ใช้ในแผงโซลาร์เซลล์ประสิทธิภาพสูง (CdTe)",
    trivia: "กึ่งโลหะหายากที่ใช้ผสมกับแคดเมียมเพื่อผลิตแผงโซลาร์เซลล์แบบฟิล์มบางชนิด Cadmium Telluride",
    atomicMass: 127.60
  },
  {
    symbol: "Po",
    nameTH: "โพโลเนียม",
    nameEN: "Polonium",
    atomicNumber: 84,
    group: 16,
    period: 6,
    category: "post-transition-metal",
    hint: "ธาตุกัมมันตรังสี ตั้งชื่อตามประเทศโปแลนด์",
    trivia: "ค้นพบโดยมารี กูรี ตั้งชื่อเป็นเกียรติแก่โปแลนด์บ้านเกิด ปล่อยรังสีแอลฟาเข้มข้นจนให้ความร้อนได้ในตัวเอง",
    atomicMass: 209.0
  },

  // ==========================================
  // หมู่ 17 (7A): แฮโลเจน (Halogens)
  // ==========================================
  {
    symbol: "F",
    nameTH: "ฟลูออรีน",
    nameEN: "Fluorine",
    atomicNumber: 9,
    group: 17,
    period: 2,
    category: "halogen",
    hint: "ว่องไวที่สุด ป้องกันฟันผุในยาสีฟัน",
    trivia: "ธาตุที่มีสภาพดึงดูดอิเล็กตรอน (Electronegativity) สูงที่สุดในตารางธาตุ ฟลูออไรด์ช่วยเคลือบป้องกันฟันผุ และใช้ทำกระทะเทฟลอน",
    atomicMass: 18.998
  },
  {
    symbol: "Cl",
    nameTH: "คลอรีน",
    nameEN: "Chlorine",
    atomicNumber: 17,
    group: 17,
    period: 3,
    category: "halogen",
    hint: "แก๊สฆ่าเชื้อโรคในน้ำประปาและสระว่ายน้ำ",
    trivia: "แก๊สสีเขียวตองอ่อน มีฤทธิ์ออกซิไดซ์สูงมาก ใช้ฆ่าเชื้อโรคในระบบผลิตน้ำประปาและสระว่ายน้ำทั่วโลก",
    atomicMass: 35.45
  },
  {
    symbol: "Br",
    nameTH: "โบรมีน",
    nameEN: "Bromine",
    atomicNumber: 35,
    group: 17,
    period: 4,
    category: "halogen",
    hint: "อโลหะชนิดเดียวที่เป็นของเหลวที่อุณหภูมิห้อง",
    trivia: "ของเหลวสีน้ำตาลแดงระเหยเป็นไอรุนแรง เป็นหนึ่งในเพียง 2 ธาตุในตารางธาตุที่เป็นของเหลวที่สภาวะมาตรฐาน (คู่กับปรอท)",
    atomicMass: 79.904
  },
  {
    symbol: "I",
    nameTH: "ไอโอดีน",
    nameEN: "Iodine",
    atomicNumber: 53,
    group: 17,
    period: 5,
    category: "halogen",
    hint: "ป้องกันโรคคอพอก ระเหิดเป็นไอสีม่วง",
    trivia: "ผลึกสีเทาเข้มระเหิดกลายเป็นไอสีม่วงสวยงาม ร่างกายใช้สร้างฮอร์โมนไทรอยด์ ป้องกันโรคเอ๋อและโรคคอพอก",
    atomicMass: 126.90
  },
  {
    symbol: "At",
    nameTH: "แอสทาทีน",
    nameEN: "Astatine",
    atomicNumber: 85,
    group: 17,
    period: 6,
    category: "halogen",
    hint: "ธาตุฮาโลเจนกัมมันตรังสีหายากยิ่ง",
    trivia: "ธาตุที่หายากที่สุดในเปลือกโลก มีปริมาณรวมทั้งโลกไม่ถึง 30 กรัม สลายตัวอย่างรวดเร็วมาก",
    atomicMass: 210.0
  },

  // ==========================================
  // หมู่ 18 (8A): แก๊สมีตระกูล / แก๊สเฉื่อย (Noble Gases)
  // ==========================================
  {
    symbol: "He",
    nameTH: "ฮีเลียม",
    nameEN: "Helium",
    atomicNumber: 2,
    group: 18,
    period: 1,
    category: "noble-gas",
    hint: "บรรจุลูกโป่งสวรรค์ สูดแล้วเสียงแหลม",
    trivia: "แก๊สที่เบาเป็นอันดับสอง ไม่ติดไฟ ปลอดภัยสูง ฮีเลียมเหลวใช้ระบายความร้อนแม่เหล็กยิ่งยวดในเครื่องสแกน MRI",
    atomicMass: 4.0026
  },
  {
    symbol: "Ne",
    nameTH: "นีออน",
    nameEN: "Neon",
    atomicNumber: 10,
    group: 18,
    period: 2,
    category: "noble-gas",
    hint: "ให้แสงสีแดงส้มสว่างสดในป้ายไฟนีออน",
    trivia: "เมื่อได้รับกระแสไฟฟ้าแรงดันสูงจะเปล่งแสงสีส้มแดงสดใส เป็นจุดกำเนิดของป้ายโฆษณานีออนยามค่ำคืนทั่วโลก",
    atomicMass: 20.180
  },
  {
    symbol: "Ar",
    nameTH: "อาร์กอน",
    nameEN: "Argon",
    atomicNumber: 18,
    group: 18,
    period: 3,
    category: "noble-gas",
    hint: "บรรจุในหลอดไฟกันไส้ทังสเตนขาด",
    trivia: "แก๊สเฉื่อยที่มีปริมาณมากที่สุดในบรรยากาศโลก (ประมาณ 0.93%) บรรจุในหลอดไฟและใช้เป็นแก๊สปกคลุมในงานเชื่อมโลหะ",
    atomicMass: 39.948
  },
  {
    symbol: "Kr",
    nameTH: "คริปทอน",
    nameEN: "Krypton",
    atomicNumber: 36,
    group: 18,
    period: 4,
    category: "noble-gas",
    hint: "ใช้ในแฟลชถ่ายภาพความเร็วสูงและแสงรันเวย์",
    trivia: "เปล่งแสงสีขาวเข้มสว่างวาบ นิยมใช้ในหลอดแฟลชกล้องถ่ายภาพความเร็วสูงและไฟสัญญาณรันเวย์สนามบิน",
    atomicMass: 83.798
  },
  {
    symbol: "Xe",
    nameTH: "ซีนอน",
    nameEN: "Xenon",
    atomicNumber: 54,
    group: 18,
    period: 5,
    category: "noble-gas",
    hint: "ใช้ในไฟหน้ารถยนต์ซีนอนและเครื่องยนต์ไอออนอวกาศ",
    trivia: "แก๊สเฉื่อยความหนาแน่นสูง ให้แสงสีฟ้าขาวสว่างจัด และใช้เป็นเชื้อเพลิงในเครื่องยนต์ขับดันไอออน (Ion thruster) ของยานอวกาศ",
    atomicMass: 131.29
  },
  {
    symbol: "Rn",
    nameTH: "เรดอน",
    nameEN: "Radon",
    atomicNumber: 86,
    group: 18,
    period: 6,
    category: "noble-gas",
    hint: "แก๊สกัมมันตรังสีที่สะสมในชั้นใต้ดิน",
    trivia: "แก๊สไร้สีไร้กลิ่นที่มีกัมมันตรังสี เกิดจากการสลายตัวของเรเดียมและยูเรเนียมตามธรรมชาติในหินแกรนิต",
    atomicMass: 222.0
  },

  // ==========================================
  // โลหะแทรนซิชันที่สำคัญ (Transition Metals)
  // ==========================================
  {
    symbol: "Sc",
    nameTH: "สแคนเดียม",
    nameEN: "Scandium",
    atomicNumber: 21,
    group: 3,
    period: 4,
    category: "transition-metal",
    hint: "ผสมในอะลูมิเนียมสร้างเฟรมจักรยานน้ำหนักเบา",
    trivia: "โลหะแทรนซิชันตัวแรกในตารางธาตุ นิยมใช้ผสมกับอะลูมิเนียมเพื่อเพิ่มความแข็งแกร่งเป็นพิเศษในอุปกรณ์กีฬาและชิ้นส่วนเครื่องบินรบ",
    atomicMass: 44.956
  },
  {
    symbol: "Ti",
    nameTH: "ไทเทเนียม",
    nameEN: "Titanium",
    atomicNumber: 22,
    group: 4,
    period: 4,
    category: "transition-metal",
    hint: "แข็งแกร่งเท่าเหล็กแต่เบากว่ามาก ปลอดภัยต่อร่างกาย",
    trivia: "โลหะที่ไม่ทำปฏิกิริยากับเนื้อเยื่อมนุษย์ (Biocompatible) จึงใช้ทำข้อต่อกระดูกเทียมและรากฟันเทียม รวมถึงชิ้นส่วนเครื่องบินไอพ่น",
    atomicMass: 47.867
  },
  {
    symbol: "V",
    nameTH: "วาเนเดียม",
    nameEN: "Vanadium",
    atomicNumber: 23,
    group: 5,
    period: 4,
    category: "transition-metal",
    hint: "เหล็กกล้าโครมวาเนเดียมทำเครื่องมือช่าง",
    trivia: "ตั้งชื่อตามเทพีแห่งความงาม Vanadis ใช้ผสมกับเหล็กกล้าทำให้มีความเหนียวและทนต่อแรงกระแทกสูงในประแจและเครื่องมือช่าง",
    atomicMass: 50.942
  },
  {
    symbol: "Cr",
    nameTH: "โครเมียม",
    nameEN: "Chromium",
    atomicNumber: 24,
    group: 6,
    period: 4,
    category: "transition-metal",
    hint: "ชุบโครเมียมเงางาม ป้องกันสนิมในสแตนเลส",
    trivia: "ผสมในเหล็กอย่างน้อย 10.5% เพื่อสร้างสแตนเลส (เหล็กกล้าไร้สนิม) ที่ไม่ผุกร่อน และให้ความเงางามหรูหรา",
    atomicMass: 51.996
  },
  {
    symbol: "Mn",
    nameTH: "แมงกานีส",
    nameEN: "Manganese",
    atomicNumber: 25,
    group: 7,
    period: 4,
    category: "transition-metal",
    hint: "ส่วนประกอบในถ่านไฟฉายและด่างทับทิม",
    trivia: "แมงกานีสไดออกไซด์เป็นสารสำคัญในถ่านไฟฉาย และโพแทสเซียมเปอร์แมงกาเนต (ด่างทับทิม) ใช้ล้างผักฆ่าเชื้อโรค",
    atomicMass: 54.938
  },
  {
    symbol: "Fe",
    nameTH: "เหล็ก",
    nameEN: "Iron",
    atomicNumber: 26,
    group: 8,
    period: 4,
    category: "transition-metal",
    hint: "แกนกลางฮีโมโกลบินในเม็ดเลือดแดงและโครงสร้างตึก",
    trivia: "โลหะที่เป็นกระดูกสันหลังของอารยธรรมมนุษย์ และเป็นอะตอมใจกลางฮีโมโกลบินที่ลำเลียงออกซิเจนไปเลี้ยงทั่วร่างกาย",
    atomicMass: 55.845
  },
  {
    symbol: "Co",
    nameTH: "โคบอลต์",
    nameEN: "Cobalt",
    atomicNumber: 27,
    group: 9,
    period: 4,
    category: "transition-metal",
    hint: "สีน้ำเงินโคบอลต์และหัวใจวิตามินบี 12",
    trivia: "แกนกลางของวิตามิน B12 (โคบาลามิน) ที่จำเป็นต่อระบบประสาท และสารประกอบโคบอลต์ให้สีน้ำเงินเข้มในเครื่องเคลือบเซรามิก",
    atomicMass: 58.933
  },
  {
    symbol: "Ni",
    nameTH: "นิกเกิล",
    nameEN: "Nickel",
    atomicNumber: 28,
    group: 10,
    period: 4,
    category: "transition-metal",
    hint: "ใช้ทำเหรียญกษาปณ์และแบตเตอรี่ชาร์จซ้ำ",
    trivia: "โลหะสีเงินวาวทนการสึกหรอ ใช้ผสมทำเหรียญกษาปณ์และเป็นส่วนประกอบหลักในแบตเตอรี่ชนิด NiMH และลิเทียม NMC",
    atomicMass: 58.693
  },
  {
    symbol: "Cu",
    nameTH: "ทองแดง",
    nameEN: "Copper",
    atomicNumber: 29,
    group: 11,
    period: 4,
    category: "transition-metal",
    hint: "นำไฟฟ้าดีเยี่ยม หัวใจของสายไฟทั่วโลก",
    trivia: "หนึ่งในโลหะชนิดแรกที่มนุษย์นำมาหลอมใช้ นำไฟฟ้าและความร้อนได้ยอดเยี่ยมเป็นอันดับสองรองจากเงิน",
    atomicMass: 63.546
  },
  {
    symbol: "Zn",
    nameTH: "สังกะสี",
    nameEN: "Zinc",
    atomicNumber: 30,
    group: 12,
    period: 4,
    category: "transition-metal",
    hint: "ชุบเคลือบกัลวาไนซ์กันสนิม เสริมภูมิคุ้มกัน",
    trivia: "ใช้ชุบเคลือบแผ่นเหล็กเพื่อเป็นแผ่นสังกะสีมุงหลังคา และเป็นแร่ธาตุสำคัญในร่างกายที่ช่วยกระตุ้นภูมิคุ้มกันและการรักษาบาดแผล",
    atomicMass: 65.38
  },
  {
    symbol: "Ag",
    nameTH: "เงิน",
    nameEN: "Silver",
    atomicNumber: 47,
    group: 11,
    period: 5,
    category: "transition-metal",
    hint: "นำไฟฟ้าและความร้อนดีที่สุดในบรรดาธาตุทั้งหมด",
    trivia: "เป็นแชมป์อันดับ 1 ของตารางธาตุในการนำความร้อนและกระแสไฟฟ้า ทั้งยังมีสมบัติต้านและฆ่าเชื้อแบคทีเรียตามธรรมชาติ",
    atomicMass: 107.87
  },
  {
    symbol: "Pt",
    nameTH: "แพลทินัม (ทองคำขาว)",
    nameEN: "Platinum",
    atomicNumber: 78,
    group: 10,
    period: 6,
    category: "transition-metal",
    hint: "โลหะล้ำค่า ตัวเร่งปฏิกิริยาในท่อไอเสีย",
    trivia: "โลหะมีค่าที่มีความเฉื่อยทางเคมีสูงมาก ใช้เป็นตัวเร่งปฏิกิริยาแปลงแก๊สพิษในท่อไอเสียรถยนต์ให้เป็นแก๊สที่ปลอดภัยขึ้น",
    atomicMass: 195.08
  },
  {
    symbol: "Au",
    nameTH: "ทองคำ",
    nameEN: "Gold",
    atomicNumber: 79,
    group: 11,
    period: 6,
    category: "transition-metal",
    hint: "ไม่เป็นสนิม ตีแผ่เป็นแผ่นบางได้ดีที่สุดในโลก",
    trivia: "ทองคำหนักเพียง 1 กรัม สามารถตีแผ่ให้บางจนเป็นแผ่นทองคำเปลวโปร่งแสงครอบคลุมพื้นที่ได้ถึง 1 ตารางเมตร",
    atomicMass: 196.97
  },
  {
    symbol: "Hg",
    nameTH: "ปรอท",
    nameEN: "Mercury",
    atomicNumber: 80,
    group: 12,
    period: 6,
    category: "transition-metal",
    hint: "โลหะชนิดเดียวที่เป็นของเหลวที่อุณหภูมิห้อง",
    trivia: "ของเหลวสีเงินวาวที่มีความหนาแน่นสูงมาก ก้อนเหล็กสามารถลอยอยู่บนผิวปรอทได้ อดีตเคยนิยมใช้ในเทอร์โมมิเตอร์วัดไข้",
    atomicMass: 200.59
  }
];

export const CATEGORY_INFO: Record<ElementCategory, {
  label: string;
  bg: string;
  badgeBg: string;
  text: string;
  border: string;
  emoji: string;
}> = {
  'alkali-metal': {
    label: 'โลหะแอลคาไล (หมู่ 1A)',
    bg: 'bg-rose-100 dark:bg-rose-950/40',
    badgeBg: 'bg-rose-500 text-white',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-400',
    emoji: '⚡'
  },
  'alkaline-earth-metal': {
    label: 'โลหะแอลคาไลน์เอิร์ท (หมู่ 2A)',
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    badgeBg: 'bg-amber-500 text-white',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-400',
    emoji: '🦴'
  },
  'transition-metal': {
    label: 'โลหะแทรนซิชัน (หมู่ B)',
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    badgeBg: 'bg-blue-500 text-white',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-400',
    emoji: '⚔️'
  },
  'post-transition-metal': {
    label: 'โลหะหลังทรานซิชัน',
    bg: 'bg-teal-100 dark:bg-teal-950/40',
    badgeBg: 'bg-teal-500 text-white',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-400',
    emoji: '🥫'
  },
  'metalloid': {
    label: 'กึ่งโลหะ',
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    badgeBg: 'bg-emerald-600 text-white',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-400',
    emoji: '💻'
  },
  'nonmetal': {
    label: 'อโลหะ',
    bg: 'bg-lime-100 dark:bg-lime-950/40',
    badgeBg: 'bg-lime-600 text-white',
    text: 'text-lime-800 dark:text-lime-300',
    border: 'border-lime-400',
    emoji: '🌱'
  },
  'halogen': {
    label: 'ฮาโลเจน (หมู่ 7A)',
    bg: 'bg-purple-100 dark:bg-purple-950/40',
    badgeBg: 'bg-purple-500 text-white',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-400',
    emoji: '🧪'
  },
  'noble-gas': {
    label: 'แก๊สเฉื่อย (หมู่ 8A)',
    bg: 'bg-sky-100 dark:bg-sky-950/40',
    badgeBg: 'bg-sky-500 text-white',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-400',
    emoji: '🎈'
  }
};

export const LEVEL1_GROUP_PROGRESSION = [
  [1],
  [1, 2],
  [1, 2, 13],
  [1, 2, 13, 14],
  [1, 2, 13, 14, 15],
  [1, 2, 13, 14, 15, 16],
  [1, 2, 13, 14, 15, 16, 17],
  [1, 2, 13, 14, 15, 16, 17, 18],
  [1, 2, 4, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18],
];

export const TUTORIAL_CONFIG = {
  activeGroups: [1],
  fixedSymbol: "Na"
};

export const GROUP_NAMES_TH: Record<number, string> = {
  1: "โลหะแอลคาไล (หมู่ 1A)",
  2: "โลหะแอลคาไลน์เอิร์ท (หมู่ 2A)",
  3: "โลหะแทรนซิชัน (หมู่ 3B)",
  4: "โลหะแทรนซิชัน (หมู่ 4B)",
  5: "โลหะแทรนซิชัน (หมู่ 5B)",
  6: "โลหะแทรนซิชัน (หมู่ 6B)",
  7: "โลหะแทรนซิชัน (หมู่ 7B)",
  8: "โลหะแทรนซิชัน (หมู่ 8B)",
  9: "โลหะแทรนซิชัน (หมู่ 8B)",
  10: "โลหะแทรนซิชัน (หมู่ 8B)",
  11: "โลหะแทรนซิชัน (หมู่ 1B)",
  12: "โลหะแทรนซิชัน (หมู่ 2B)",
  13: "หมู่โบรอน (หมู่ 3A)",
  14: "หมู่คาร์บอน (หมู่ 4A)",
  15: "หมู่ไนโตรเจน (หมู่ 5A)",
  16: "หมู่ออกซิเจน / แชลโคเจน (หมู่ 6A)",
  17: "ฮาโลเจน (หมู่ 7A)",
  18: "แก๊สเฉื่อย / มีตระกูล (หมู่ 8A)"
};
