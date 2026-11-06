import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../lib/firebase";

const PLANS = [
  ["free", "ฟรี", "5 คำถาม ไม่มีวันหมดอายุ"],
  ["monthly_99", "รายเดือน 99 บาท", "20 คำถาม / 30 วัน / วันละ 1"],
  ["monthly_199", "รายเดือนพิเศษ 199 บาท", "45 คำถาม / 30 วัน / วันละ 2"],
  ["yearly", "รายปี 999 บาท", "230 คำถาม / 365 วัน / วันละ 5"],
  ["vip", "VIP 1,999 บาท", "700 คำถาม / 1,095 วัน / วันละ 8"],
];

function dateText(value) {
  if (!value) return "-";
  const d = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString("th-TH") : "-";
}

export default function AdminMemberManager() {
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({ plan: "free", role: "member", status: "active", questionUsed: 0, resetUsage: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const selected = useMemo(() => members.find((m) => m.id === selectedId) || null, [members, selectedId]);

  async function loadMembers(preferredId = "") {
    setLoading(true); setNotice("");
    try {
      const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(100)));
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMembers(rows);
      setSelectedId(preferredId || selectedId || rows[0]?.id || "");
    } catch (error) { setNotice(error?.message || "โหลดสมาชิกไม่สำเร็จ"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadMembers(); }, []);
  useEffect(() => {
    if (!selected) return;
    setForm({ plan: selected.plan === "monthly" ? "monthly_99" : selected.plan || "free", role: selected.role || "member", status: selected.status || "active", questionUsed: Number(selected.questionUsed || 0), resetUsage: false });
  }, [selected]);

  async function save(event) {
    event.preventDefault(); if (!selected) return;
    setSaving(true); setNotice("");
    try {
      const call = httpsCallable(functions, "adminUpdateMember");
      const result = await call({ userId: selected.id, plan: form.plan, role: form.role, status: form.status, questionUsed: Number(form.questionUsed || 0), resetUsage: Boolean(form.resetUsage) });
      await loadMembers(selected.id);
      setNotice(
        result.data?.message || "บันทึกสิทธิสมาชิกเรียบร้อยแล้ว",
      );
    } catch (error) { setNotice(error?.details || error?.message || "บันทึกไม่สำเร็จ"); }
    finally { setSaving(false); }
  }

  return (
    <section className="panel adminPanel member-manager-panel">
      <div className="sectionHead"><div><span className="free-member-label">ADMIN MEMBER MANAGEMENT</span><h3>จัดการสิทธิสมาชิก</h3></div><button type="button" className="secondary small" onClick={() => loadMembers(selectedId)} disabled={loading}>{loading ? "กำลังโหลด..." : "รีเฟรช"}</button></div>
      {notice && <p className="notice">{notice}</p>}
      <div className="member-manager-grid">
        <div className="member-manager-list">{members.map((m) => <button key={m.id} type="button" className={m.id === selectedId ? "member-select is-active" : "member-select"} onClick={() => setSelectedId(m.id)}><strong>{m.name || m.displayName || "ไม่ระบุชื่อ"}</strong><span>{m.email || "ไม่ระบุอีเมล"}</span><small>{m.role === "admin" ? "แอดมิน" : "สมาชิก"} | {m.plan || "free"} | {Number(m.questionUsed || 0)}/{Number(m.questionLimit || 0)}</small></button>)}</div>
        {selected ? <form className="member-manager-form" onSubmit={save}>
          <div className="member-manager-heading"><strong>{selected.name || selected.displayName || "ไม่ระบุชื่อ"}</strong><span>{selected.email || "ไม่ระบุอีเมล"}</span></div>
          <label>แพ็กเกจ<select value={form.plan} onChange={(e) => setForm((x) => ({ ...x, plan: e.target.value }))}>{PLANS.map(([value, label, summary]) => <option key={value} value={value}>{label} | {summary}</option>)}</select></label>
          <div className="member-manager-row"><label>บทบาท<select value={form.role} onChange={(e) => setForm((x) => ({ ...x, role: e.target.value }))}><option value="member">สมาชิก</option><option value="admin">แอดมิน</option></select></label><label>สถานะบัญชี<select value={form.status} onChange={(e) => setForm((x) => ({ ...x, status: e.target.value }))}><option value="active">ใช้งาน</option><option value="suspended">ระงับ</option></select></label></div>
          <label>จำนวนคำถามที่ใช้แล้ว<input type="number" min="0" value={form.questionUsed} onChange={(e) => setForm((x) => ({ ...x, questionUsed: e.target.value }))} /></label>
          <label className="member-manager-check"><input type="checkbox" checked={form.resetUsage} onChange={(e) => setForm((x) => ({ ...x, resetUsage: e.target.checked }))} />รีเซ็ตสิทธิที่ใช้แล้วและตัวนับรายวัน</label>
          <div className="member-manager-current"><span>สิทธิปัจจุบัน: {Number(selected.questionUsed || 0)} / {Number(selected.questionLimit || 0)}</span><span>จำกัดต่อวัน: {Number(selected.dailyQuestionLimit || 0)}</span><span>หมดอายุ: {dateText(selected.planExpiresAt)}</span></div>
          <button type="submit" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกสิทธิสมาชิก"}
          </button>
          {notice && (
            <p className="notice member-manager-result" role="status">
              {notice}
            </p>
          )}
        </form> : <p>ยังไม่มีสมาชิกให้จัดการ</p>}
      </div>
    </section>
  );
}
