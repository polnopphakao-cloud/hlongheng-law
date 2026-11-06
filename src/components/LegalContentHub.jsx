import { useMemo, useState } from "react";

const services = [
  {
    icon: "📜",
    title: "มรดกและพินัยกรรม",
    description: "ให้คำปรึกษาเรื่องทายาท พินัยกรรม ผู้จัดการมรดก การแบ่งทรัพย์ และข้อพิพาทเกี่ยวกับกองมรดก",
    documents: "พินัยกรรม ทะเบียนบ้าน มรณบัตร เอกสารทรัพย์สิน และคำสั่งศาลที่เกี่ยวข้อง",
  },
  {
    icon: "🏠",
    title: "ที่ดินและอสังหาริมทรัพย์",
    description: "ตรวจสิทธิในที่ดิน สัญญาซื้อขาย การครอบครอง การรังวัด การจดทะเบียน และข้อพิพาทกับสำนักงานที่ดิน",
    documents: "โฉนด สารบบที่ดิน หนังสือสัญญา แผนที่ ภาพถ่าย และหนังสือติดต่อราชการ",
  },
  {
    icon: "⚖",
    title: "คดีแพ่งและสัญญา",
    description: "วิเคราะห์สิทธิและหน้าที่ตามสัญญา หนี้ ละเมิด การผิดนัด การบอกเลิกสัญญา และการเรียกค่าเสียหาย",
    documents: "สัญญา ใบเสร็จ หลักฐานการชำระเงิน หนังสือทวงถาม และข้อความสนทนา",
  },
  {
    icon: "👨‍👩‍👧",
    title: "ครอบครัว",
    description: "ให้คำปรึกษาเรื่องหย่า อำนาจปกครอง บุตร ค่าอุปการะเลี้ยงดู และการจัดการสินสมรส",
    documents: "ทะเบียนสมรส สูติบัตร หลักฐานรายได้ และเอกสารทรัพย์สิน",
  },
  {
    icon: "🛡",
    title: "คดีอาญา",
    description: "ให้คำปรึกษาและดำเนินคดีทั้งฝ่ายผู้เสียหาย ผู้ร้องทุกข์ ผู้ต้องหา และจำเลยตามกระบวนการยุติธรรม",
    documents: "หมายเรียก บันทึกประจำวัน คำให้การ ภาพถ่าย คลิป และพยานเอกสาร",
  },
  {
    icon: "🛒",
    title: "คดีผู้บริโภค",
    description: "ปัญหาสินค้า บริการ สัญญาไม่เป็นธรรม การโฆษณา การรับประกัน และความเสียหายของผู้บริโภค",
    documents: "ใบสั่งซื้อ ใบเสร็จ เงื่อนไขบริการ ภาพสินค้า และการติดต่อกับผู้ประกอบการ",
  },
  {
    icon: "💼",
    title: "แรงงาน",
    description: "ให้คำปรึกษาเรื่องค่าจ้าง เลิกจ้าง ค่าชดเชย สภาพการจ้าง และข้อพิพาทระหว่างนายจ้างกับลูกจ้าง",
    documents: "สัญญาจ้าง สลิปเงินเดือน หนังสือเลิกจ้าง และระเบียบการทำงาน",
  },
  {
    icon: "📝",
    title: "ร่างและตรวจสัญญา",
    description: "ร่าง ตรวจ และปรับปรุงเงื่อนไขสัญญาให้ชัดเจน ลดความเสี่ยง และสอดคล้องกับวัตถุประสงค์ของคู่สัญญา",
    documents: "ร่างสัญญาเดิม รายละเอียดคู่สัญญา ขอบเขตงาน ราคา และกำหนดเวลา",
  },
];

const articles = [
  {
    category: "มรดก",
    title: "ผู้จัดการมรดกมีหน้าที่อะไร และทายาทตรวจสอบได้อย่างไร",
    summary: "ภาพรวมหน้าที่รวบรวมทรัพย์ ชำระหนี้ จัดทำบัญชี และแบ่งมรดก พร้อมรายการเอกสารที่ทายาทควรขอตรวจสอบ",
  },
  {
    category: "พินัยกรรม",
    title: "พินัยกรรมแบบใดมีผลสมบูรณ์",
    summary: "ทำความเข้าใจรูปแบบพินัยกรรม พยาน ลายมือชื่อหรือลายพิมพ์นิ้วมือ และข้อควรระวังเรื่องความสามารถของผู้ทำพินัยกรรม",
  },
  {
    category: "ที่ดิน",
    title: "ก่อนซื้อที่ดินควรตรวจเอกสารใดบ้าง",
    summary: "เช็กลิสต์โฉนด ภาระผูกพัน แนวเขต ทางออกสาธารณะ สารบบที่ดิน และข้อจำกัดการใช้ประโยชน์",
  },
  {
    category: "วิธีพิจารณาคดี",
    title: "ได้รับหมายเรียกและสำเนาคำฟ้อง ควรทำอย่างไร",
    summary: "ขั้นตอนตรวจวันรับหมาย กำหนดยื่นคำให้การ การรวบรวมข้อเท็จจริง และการเตรียมพยานหลักฐานเบื้องต้น",
  },
];

const dekaItems = [
  {
    title: "แนวฎีกาเรื่องการส่งหมายและการนับระยะเวลา",
    issue: "การส่งหมายโดยวิธีปิดหมายและวันเริ่มนับกำหนดเวลา",
    note: "ใช้สำหรับศึกษาหลักการนับระยะเวลาเบื้องต้น โดยต้องตรวจคำพิพากษาฉบับเต็มและข้อเท็จจริงเฉพาะคดีทุกครั้ง",
  },
  {
    title: "แนวฎีกาเรื่องผู้จัดการมรดก",
    issue: "ขอบเขตหน้าที่ การจัดการทรัพย์ และเหตุขอถอดถอน",
    note: "ควรพิจารณาคำสั่งแต่งตั้ง บัญชีทรัพย์มรดก พฤติการณ์จัดการ และความเสียหายแก่กองมรดกร่วมกัน",
  },
  {
    title: "แนวฎีกาเรื่องพินัยกรรม",
    issue: "แบบของพินัยกรรม ความสามารถ และน้ำหนักพยาน",
    note: "การวินิจฉัยขึ้นอยู่กับรูปแบบเอกสาร พยานผู้รู้เห็น การเก็บรักษา และข้อเท็จจริงขณะทำพินัยกรรม",
  },
];

const guides = [
  "เช็กลิสต์เอกสารก่อนปรึกษาคดีมรดก",
  "เช็กลิสต์เอกสารที่ดินและสารบบที่ควรตรวจ",
  "คู่มือเตรียมตัวเมื่อได้รับหมายศาล",
  "คู่มือรวบรวมหลักฐานดิจิทัลและข้อความสนทนา",
];

export default function LegalContentHub({ onConsult }) {
  const [tab, setTab] = useState("articles");
  const [search, setSearch] = useState("");

  const filteredArticles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return articles;
    return articles.filter((item) =>
      `${item.category} ${item.title} ${item.summary}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [search]);

  return (
    <>
      <section id="legal-services" className="legal-section legal-services-section">
        <div className="legal-section-heading">
          <div>
            <span className="legal-kicker">LEGAL SERVICES</span>
            <h2>บริการกฎหมาย</h2>
            <p>เลือกประเภทเรื่องที่ต้องการปรึกษา พร้อมดูขอบเขตงานและเอกสารที่ควรเตรียมเบื้องต้น</p>
          </div>
          <button type="button" className="legal-consult-button" onClick={onConsult}>
            ปรึกษาคดี
          </button>
        </div>

        <div className="legal-service-grid">
          {services.map((service) => (
            <article className="legal-service-card" key={service.title}>
              <div className="legal-service-icon" aria-hidden="true">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <details>
                <summary>เอกสารที่ควรเตรียม</summary>
                <p>{service.documents}</p>
              </details>
              <button type="button" onClick={onConsult}>ปรึกษาเรื่องนี้</button>
            </article>
          ))}
        </div>
      </section>

      <section id="legal-knowledge" className="legal-section legal-knowledge-section">
        <div className="legal-section-heading">
          <div>
            <span className="legal-kicker">LEGAL KNOWLEDGE</span>
            <h2>คลังความรู้กฎหมาย</h2>
            <p>บทความ ฎีกาน่ารู้ และคู่มือที่เรียบเรียงให้อ่านง่าย พร้อมเชื่อมโยงไปตรวจสอบแหล่งข้อมูลทางการ</p>
          </div>
        </div>

        <div className="knowledge-toolbar">
          <div className="knowledge-tabs" role="tablist" aria-label="หมวดคลังความรู้">
            <button type="button" className={tab === "articles" ? "is-active" : ""} onClick={() => setTab("articles")}>บทความกฎหมาย</button>
            <button type="button" className={tab === "deka" ? "is-active" : ""} onClick={() => setTab("deka")}>ฎีกาน่ารู้</button>
            <button type="button" className={tab === "guides" ? "is-active" : ""} onClick={() => setTab("guides")}>คู่มือประชาชน</button>
          </div>
          {tab === "articles" && (
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหา เช่น มรดก พินัยกรรม ที่ดิน สัญญา..."
              aria-label="ค้นหาบทความกฎหมาย"
            />
          )}
        </div>

        {tab === "articles" && (
          <div className="knowledge-grid">
            {filteredArticles.map((article) => (
              <article className="knowledge-card" key={article.title}>
                <span>{article.category}</span>
                <h3>{article.title}</h3>
                <p>{article.summary}</p>
                <button type="button" onClick={onConsult}>สอบถามเพิ่มเติม</button>
              </article>
            ))}
            {filteredArticles.length === 0 && <p className="knowledge-empty">ไม่พบบทความที่ตรงกับคำค้น</p>}
          </div>
        )}

        {tab === "deka" && (
          <div className="knowledge-grid">
            {dekaItems.map((item) => (
              <article className="knowledge-card deka-card" key={item.title}>
                <span>ฎีกาน่ารู้</span>
                <h3>{item.title}</h3>
                <p><strong>ประเด็น:</strong> {item.issue}</p>
                <p>{item.note}</p>
                <a href="https://deka.supremecourt.or.th/" target="_blank" rel="noreferrer">ตรวจสอบจากระบบสืบค้นศาลฎีกา</a>
              </article>
            ))}
          </div>
        )}

        {tab === "guides" && (
          <div className="guide-list">
            {guides.map((guide, index) => (
              <article key={guide}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{guide}</h3>
                  <p>รายการตรวจสอบเบื้องต้นเพื่อช่วยจัดข้อมูลให้เป็นระบบก่อนรับคำปรึกษา</p>
                </div>
                <button type="button" onClick={onConsult}>ขอคำแนะนำ</button>
              </article>
            ))}
          </div>
        )}

        <div className="legal-disclaimer">
          <strong>ข้อควรทราบ</strong>
          <p>เนื้อหาในคลังความรู้จัดทำเพื่อเผยแพร่ความรู้ทั่วไป ไม่ใช่คำปรึกษากฎหมายเฉพาะคดี ข้อเท็จจริง เอกสาร และพยานหลักฐานของแต่ละกรณีอาจทำให้ผลทางกฎหมายแตกต่างกัน</p>
        </div>
      </section>
    </>
  );
}
