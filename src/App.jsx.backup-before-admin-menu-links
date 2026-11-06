import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
 where,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "./lib/firebase";

const empty = { name: "", email: "", password: "" };

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mode, setMode] = useState("home");
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState("");

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (!u) {
          setProfile(null);
          setIsAdmin(false);
          setMode("home");
          return;
        }
        const [profileSnap, adminSnap] = await Promise.all([
          getDoc(doc(db, "users", u.uid)),
          getDoc(doc(db, "admins", u.uid)),
        ]);
        setProfile(profileSnap.exists() ? profileSnap.data() : null);
        setIsAdmin(adminSnap.exists() && adminSnap.data().active === true);
        setMode("dashboard");
      }),
    [],
  );

  async function register(e) {
    e.preventDefault();
    setMsg("");
    try {
      const c = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      );
      await updateProfile(c.user, { displayName: form.name });
      await setDoc(doc(db, "users", c.user.uid), {
        name: form.name,
        email: form.email,
        role: "member",
        plan: "free",
        questionLimit: 0,
        questionUsed: 0,
        status: "active",
        createdAt: serverTimestamp(),
      });
      setMsg("สมัครสมาชิกสำเร็จ");
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function login(e) {
    e.preventDefault();
    setMsg("");
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (mode === "auth")
    return (
      <Auth
        {...{ form, setForm, register, login, msg }}
        back={() => setMode("home")}
      />
    );
  if (user && mode === "dashboard")
    return (
      <Dashboard
        {...{ user, profile, isAdmin }}
        logout={() => signOut(auth)}
        home={() => setMode("home")}
      />
    );

  return (
    <main className="page">
      <section className="hero">
        <div className="logo">⚖</div>
        <p className="eyebrow">NOPPAKAO LAW OFFICE</p>
        <h1>สำนักงานกฎหมายนพเก้า ทนายความ</h1>
        <p className="subtitle">รับว่าความคดีแพ่งและคดีอาญาทั่วราชอาณาจักร</p>
        <p className="description">
          ให้คำปรึกษา วิเคราะห์ข้อกฎหมาย และดำเนินคดี
          โดยยึดมั่นในความสุจริตและหลักนิติธรรม
        </p>
        <div className="actions">
 <button className="primary" onClick={() => setMode(user ? "dashboard" : "auth")}>ปรึกษาคดี</button>
          <button
            className="secondary"
            onClick={() => setMode(user ? "dashboard" : "auth")}
          >
            {user ? "แดชบอร์ด" : "สมัครสมาชิก / เข้าสู่ระบบ"}
          </button>
        </div>
      </section>
    </main>
  );
}

function Auth({ form, setForm, register, login, msg, back }) {
  const [tab, setTab] = useState("register");
  return (
    <main className="page">
      <section className="panel auth">
        <button className="link" onClick={back}>
          ← หน้าแรก
        </button>
        <h2>{tab === "register" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</h2>
        <form onSubmit={tab === "register" ? register : login}>
          {tab === "register" && (
            <input
              required
              placeholder="ชื่อ-นามสกุล"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
          <input
            required
            type="email"
            placeholder="อีเมล"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            required
            minLength="8"
            type="password"
            placeholder="รหัสผ่านอย่างน้อย 8 ตัว"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button className="primary" type="submit">
            {tab === "register" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </button>
        </form>
        {msg && <p className="notice">{msg}</p>}
        <button
          className="link"
          onClick={() => setTab(tab === "register" ? "login" : "register")}
        >
          {tab === "register"
            ? "มีบัญชีแล้ว เข้าสู่ระบบ"
            : "ยังไม่มีบัญชี สมัครสมาชิก"}
        </button>
      </section>
    </main>
  );
}

function Dashboard({ user, profile, isAdmin, logout, home }) {
  return (
    <main className="dashboard">
      <aside>
        <div className="brand">⚖ นพเก้า</div>
        <button onClick={home}>หน้าเว็บไซต์</button>
        <button type="button" onClick={() => document.getElementById("member-info")?.scrollIntoView({ behavior: "smooth" })}>ข้อมูลสมาชิก</button>
        <button type="button" onClick={() => document.getElementById("consultation-form")?.scrollIntoView({ behavior: "smooth" })}>คำถามปรึกษา</button>
        {isAdmin && (
          <>
            <button>จัดการสมาชิก</button>
            <button>การชำระเงิน</button>
            <button>รายงาน</button>
          </>
        )}
        <button onClick={logout}>ออกจากระบบ</button>
      </aside>
      <section className="content">
        <p className="eyebrow">
          {isAdmin ? "ADMIN CONTROL CENTER" : "MEMBER CENTER"}
        </p>
        <h2>สวัสดี {profile?.name || user.displayName || user.email}</h2>
        {isAdmin ? (
          <AdminDashboard />
        ) : (
          <MemberDashboard user={user} profile={profile} />
        )}
      </section>
    </main>
  );
}
function appointmentStatusLabel(status) {
  const labels = {
    pending: "รอยืนยัน",
    confirmed: "ยืนยันแล้ว",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิกแล้ว",
  };
  return labels[status] || status || "รอยืนยัน";
}


function MemberDashboard({ user, profile }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [used, setUsed] = useState(profile?.questionUsed || 0);
  const [paymentPlan, setPaymentPlan] = useState("monthly");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDateTime, setPaymentDateTime] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [sendingPayment, setSendingPayment] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState("");
  const [appointment, setAppointment] = useState({ caseType: "คดีมรดก", appointDate: "", appointTime: "" });
  const [appointmentNotice, setAppointmentNotice] = useState("");
 const [memberAppointments, setMemberAppointments] = useState([]);
  const [sendingAppointment, setSendingAppointment] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadMemberAppointments() {
      try {
        const appointmentSnap = await getDocs(
          query(collection(db, "appointments"), where("userId", "==", user.uid))
        );
        if (active) {
          setMemberAppointments(
            appointmentSnap.docs.map((item) => ({ id: item.id, ...item.data() }))
          );
        }
      } catch (e) {
        if (active) setAppointmentNotice(e.message);
      }
    }

    if (user?.uid) loadMemberAppointments();
    return () => { active = false; };
  }, [user?.uid]);

  const limitValue = profile?.questionLimit || 0;
  const remaining = Math.max(limitValue - used, 0);
  const canSubmit =
    profile?.status === "active" &&
    remaining > 0 &&
    title.trim().length >= 3 &&
    detail.trim().length >= 10;

  async function submitQuestion(e) {
    e.preventDefault();
    setNotice("");

    if (!user?.uid) {
      setNotice("ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      setSending(true);

      const userRef = doc(db, "users", user.uid);
      const questionRef = doc(collection(db, "questions"));

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
          throw new Error("ไม่พบข้อมูลสมาชิก");
        }

        const member = userSnap.data();
        const currentUsed = Number(member.questionUsed || 0);
        const currentLimit = Number(member.questionLimit || 0);

        if (member.status !== "active") {
          throw new Error("บัญชีนี้ยังไม่พร้อมใช้งาน");
        }

        if (currentUsed >= currentLimit) {
          throw new Error("สิทธิ์คำถามหมดหรือยังไม่ได้รับสิทธิ์");
        }

        transaction.set(questionRef, {
          userId: user.uid,
          userName: member.name || user.displayName || "",
          userEmail: member.email || user.email || "",
          subject: title.trim(),
          detail: detail.trim(),
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        transaction.update(userRef, {
          questionUsed: currentUsed + 1,
          updatedAt: serverTimestamp(),
        });
      });

      setUsed((value) => value + 1);
      setTitle("");
      setDetail("");
      setNotice("ส่งคำถามเรียบร้อยแล้ว");
    } catch (err) {
      setNotice(err.message || "ไม่สามารถส่งคำถามได้");
    } finally {
      setSending(false);
    }
  }

  async function submitPayment(e) {
    e.preventDefault();
    setPaymentNotice("");

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0 || !paymentDateTime || !paymentReference.trim()) {
      setPaymentNotice("กรุณากรอกข้อมูลการชำระเงินให้ครบ");
      return;
    }

    setSendingPayment(true);
    try {
      const paymentRef = doc(collection(db, "payments"));
      await setDoc(paymentRef, {
        userId: user.uid,
        userName: profile?.name || user.displayName || "",
        userEmail: profile?.email || user.email || "",
        plan: paymentPlan,
        amount,
        paidAt: paymentDateTime,
        reference: paymentReference.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setPaymentAmount("");
      setPaymentDateTime("");
      setPaymentReference("");
      setPaymentNotice("แจ้งชำระเงินเรียบร้อยแล้ว รอผู้ดูแลตรวจสอบ");
    } catch (error) {
      setPaymentNotice(error.message);
    } finally {
      setSendingPayment(false);
    }
  }

    async function submitAppointment(e) {
    e.preventDefault();
    setAppointmentNotice("");

    if (!appointment.appointDate || !appointment.appointTime) {
      setAppointmentNotice("กรุณาเลือกวันและเวลานัดหมาย");
      return;
    }

  const selectedAppointmentDateTime = new Date(
    `${appointment.appointDate}T${appointment.appointTime}`
  );
  if (Number.isNaN(selectedAppointmentDateTime.getTime()) || selectedAppointmentDateTime < new Date()) {
    setAppointmentNotice("กรุณาเลือกวันและเวลานัดหมายในอนาคต");
    return;
  }

    setSendingAppointment(true);

    try {
      await addDoc(collection(db, "appointments"), {
        userId: user.uid,
        userName: profile?.name || user.displayName || "",
        userEmail: profile?.email || user.email || "",
        caseType: appointment.caseType,
        appointDate: appointment.appointDate,
        appointTime: appointment.appointTime,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setAppointment({
        caseType: "คดีมรดก",
        appointDate: "",
        appointTime: "",
      });

      setAppointmentNotice("ส่งคำขอนัดหมายเรียบร้อยแล้ว");
    } catch (error) {
      setAppointmentNotice(error.message);
    } finally {
      setSendingAppointment(false);
    }
  }
  return (
    <>
      <div id="member-info" className="cards">
        <Card title="สถานะสมาชิก" value={profile?.plan || "free"} />
        <Card title="สิทธิ์คำถาม" value={`${used} / ${limitValue}`} />
        <Card title="สิทธิ์คงเหลือ" value={remaining} />
        <Card title="สถานะบัญชี" value={profile?.status || "active"} />
      </div>

      <section id="consultation-form" className="panel">
        <h3>ส่งคำถามปรึกษา</h3>
        <p>กรอกหัวข้อและรายละเอียดคำถามให้ครบถ้วน</p>

        <form onSubmit={submitQuestion}>
          <input
            required
            minLength="3"
            placeholder="หัวข้อคำถาม"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            required
            minLength="10"
            rows="7"
            placeholder="รายละเอียดคำถาม อย่างน้อย 10 ตัวอักษร"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />

          <button
            className="primary"
            type="submit"
            disabled={!canSubmit || sending}
          >
            {sending ? "กำลังส่ง..." : "ส่งคำถาม"}
          </button>
        </form>

        {notice && <p className="notice">{notice}</p>}

        {remaining === 0 && (
          <p className="notice">
            สิทธิ์คำถามหมดหรือยังไม่ได้รับสิทธิ์ กรุณาติดต่อผู้ดูแล
          </p>
        )}
      </section>
      <section className="card">
        <h3>แจ้งชำระเงิน</h3>
        <form onSubmit={submitPayment}>
          <select value={paymentPlan} onChange={(e) => setPaymentPlan(e.target.value)}>
            <option value="monthly">รายเดือน</option>
            <option value="yearly">รายปี</option>
          </select>
          <input type="number" min="1" step="0.01" required placeholder="จำนวนเงิน (บาท)" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
          <input type="datetime-local" required value={paymentDateTime} onChange={(e) => setPaymentDateTime(e.target.value)} />
          <input type="text" required placeholder="เลขอ้างอิงรายการโอน" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} />
          <button className="primary" type="submit" disabled={sendingPayment}>{sendingPayment ? "กำลังส่ง..." : "แจ้งชำระเงิน"}</button>
        </form>
        {paymentNotice && <p className="notice">{paymentNotice}</p>}
      </section>
<section className="card">
  <h3>นัดหมายทนาย</h3>
  <form onSubmit={submitAppointment}>
    <select
      value={appointment.caseType}
      onChange={(e) => setAppointment({ ...appointment, caseType: e.target.value })}
    >
      <option value="คดีมรดก">คดีมรดก</option>
      <option value="คดีที่ดิน">คดีที่ดิน</option>
      <option value="คดีแพ่ง">คดีแพ่ง</option>
      <option value="คดีอาญา">คดีอาญา</option>
    </select>

    <input
      type="date"
        min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)}
      value={appointment.appointDate}
      onChange={(e) => setAppointment({ ...appointment, appointDate: e.target.value })}
      required
    />

    <input
      type="time"
      value={appointment.appointTime}
      onChange={(e) => setAppointment({ ...appointment, appointTime: e.target.value })}
      required
    />

    <button type="submit" disabled={sendingAppointment}>
      {sendingAppointment ? "กำลังส่ง..." : "ส่งคำขอนัดหมาย"}
    </button>
  </form>
  {appointmentNotice && <p className="notice">{appointmentNotice}</p>}
</section>
      <section className="card">
        <h3>ประวัตินัดหมายของฉัน</h3>
        <div className="list">
          {memberAppointments.length ? (
            memberAppointments.map((appointmentItem) => (
              <div className="listItem" key={appointmentItem.id}>
                <div>
                  <strong>{appointmentItem.caseType || "ไม่ระบุประเภทคดี"}</strong>
                  <p>{appointmentItem.appointDate || "ไม่ระบุวันที่"} {appointmentItem.appointTime || ""}</p>
                </div>
                <span className={"status status-" + (appointmentItem.status || "pending")}>{appointmentStatusLabel(appointmentItem.status)}</span>
              </div>
            ))
          ) : (
            <p>ยังไม่มีประวัตินัดหมาย</p>
          )}
        </div>
      </section>
    </>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, questions: 0, payments: 0 });
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [payments, setPayments] = useState([]);
 const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [newQuestionCount, setNewQuestionCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "questions"),
      (snapshot) => {
        const pendingCount = snapshot.docs.filter((item) => (item.data().status || "pending") === "pending").length;
        setNewQuestionCount(pendingCount);
      },
      (snapshotError) => setError(snapshotError.message)
    );
    return () => unsubscribe();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [uc, qc, pc, us, qs, ps] = await Promise.all([
        getCountFromServer(collection(db, "users")),
        getCountFromServer(collection(db, "questions")),
        getCountFromServer(collection(db, "payments")),
        getDocs(
          query(
            collection(db, "users"),
            orderBy("createdAt", "desc"),
            limit(10),
          ),
        ),
        getDocs(
          query(
            collection(db, "questions"),
            orderBy("createdAt", "desc"),
            limit(10),
          ),
        ),
        getDocs(
          query(
            collection(db, "payments"),
            orderBy("createdAt", "desc"),
            limit(10),
          ),
        ),
      ]);
      setStats({
        users: uc.data().count,
        questions: qc.data().count,
        payments: pc.data().count,
      });
      setUsers(us.docs.map((d) => ({ id: d.id, ...d.data() })));
      setQuestions(qs.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPayments(ps.docs.map((d) => ({ id: d.id, ...d.data() })));
 const appointmentSnap = await getDocs(query(collection(db, "appointments"), orderBy("createdAt", "desc"), limit(10)));
 setAppointments(appointmentSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function setPlan(uid, plan) {
    const values =
      plan === "monthly"
        ? { plan, questionLimit: 5, questionUsed: 0, status: "active" }
        : plan === "yearly"
          ? { plan, questionLimit: 60, questionUsed: 0, status: "active" }
          : {
              plan: "free",
              questionLimit: 0,
              questionUsed: 0,
              status: "active",
            };
    await updateDoc(doc(db, "users", uid), {
      ...values,
      updatedAt: serverTimestamp(),
    });
    await load();
  }

  async function approvePayment(payment) {
    if (!payment || payment.status !== "pending") return;

    const values =
      payment.plan === "monthly"
        ? { plan: "monthly", questionLimit: 5, questionUsed: 0, status: "active" }
        : payment.plan === "yearly"
        ? { plan: "yearly", questionLimit: 60, questionUsed: 0, status: "active" }
        : null;

    if (!values) {
      setError("แพ็กเกจการชำระเงินไม่ถูกต้อง");
      return;
    }

    setError("");
    try {
      await updateDoc(doc(db, "users", payment.userId), {
        ...values,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "payments", payment.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function rejectPayment(payment) {
    if (!payment || payment.status !== "pending") return;

    setError("");
    try {
      await updateDoc(doc(db, "payments", payment.id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveAnswer() {
    if (!selectedQuestion || !answerText.trim()) return;
    setSavingAnswer(true);
    setError("");
    try {
      await updateDoc(doc(db, "questions", selectedQuestion.id), {
        answer: answerText.trim(),
        status: "answered",
        answeredAt: serverTimestamp(),
      });
      setSelectedQuestion(null);
      setAnswerText("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingAnswer(false);
    }
  }

  async function confirmAppointment(appointmentItem) {
    if (!appointmentItem?.id || appointmentItem.status !== "pending") return;
    setError("");
    try {
      await updateDoc(doc(db, "appointments", appointmentItem.id), {
        status: "confirmed",
        confirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function completeAppointment(appointmentItem) {
    if (!appointmentItem?.id || appointmentItem.status !== "confirmed") return;
    setError("");
    try {
      await updateDoc(doc(db, "appointments", appointmentItem.id), {
        status: "completed",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function cancelAppointment(appointmentItem) {
    if (!appointmentItem?.id || !["pending", "confirmed"].includes(appointmentItem.status)) return;
    setError("");
    try {
      await updateDoc(doc(db, "appointments", appointmentItem.id), {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      {error && <p className="notice">{error}</p>}
      <div className="cards">
        <Card title="สมาชิกทั้งหมด" value={loading ? "..." : stats.users} />
        <Card title="คำถามทั้งหมด" value={loading ? "..." : stats.questions} />
        <Card
          title="การชำระเงินทั้งหมด"
          value={loading ? "..." : stats.payments}
        />
      </div>
      <section className="panel adminPanel">
        <div className="sectionHead">
          <h3>สมาชิกล่าสุด</h3>
          <button className="secondary small" onClick={load}>
            รีเฟรช
          </button>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>แพ็กเกจ</th>
                <th>สิทธิ</th>
                <th>ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name || "-"}</td>
                  <td>{u.email || "-"}</td>
                  <td>{u.plan || "free"}</td>
                  <td>
                    {u.questionUsed || 0}/{u.questionLimit || 0}
                  </td>
                  <td className="rowActions">
                    <button onClick={() => setPlan(u.id, "free")}>Free</button>
                    <button onClick={() => setPlan(u.id, "monthly")}>
                      Monthly
                    </button>
                    <button onClick={() => setPlan(u.id, "yearly")}>
                      Yearly
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="adminSplit">
        <div className="panel">
          <h3>คำถามล่าสุด {newQuestionCount > 0 && <span style={{ color: "#ff4d4f", marginLeft: "10px" }}>คำถามใหม่ {newQuestionCount}</span>}</h3>
          {questions.length ? (
            questions.map((q) => (
              <div className="listItem questionItem" key={q.id}>
                <div>
                  <strong>{q.subject || "ไม่มีหัวข้อ"}</strong>
                  <p>{q.detail || "ไม่มีรายละเอียดคำถาม"}</p>
                  <small>
                    ผู้ส่ง: {q.userName || "-"} | {q.userEmail || "-"}
                  </small>
                </div>
                <div>
              <span>{q.status || "pending"}</span>
              <button className="secondary small" onClick={() => { setSelectedQuestion(q); setAnswerText(q.answer || ""); }}>
                ตอบคำถาม
              </button>
            </div>
              </div>
            ))
          ) : (
            <p>ยังไม่มีคำถาม</p>
          )}
        </div>
        
      {selectedQuestion && (<div className="panel"><h3>ตอบคำถาม</h3><p><strong>{selectedQuestion.subject || "ไม่มีหัวข้อ"}</strong></p><p>{selectedQuestion.detail || "ไม่มีรายละเอียดคำถาม"}</p><textarea rows="8" value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="พิมพ์คำตอบที่นี่" /><div className="actions"><button className="primary" onClick={saveAnswer} disabled={savingAnswer || !answerText.trim()}>{savingAnswer ? "กำลังบันทึก..." : "บันทึกคำตอบ"}</button><button className="secondary" onClick={() => { setSelectedQuestion(null); setAnswerText(""); }}>ยกเลิก</button></div></div>)}
        <div className="panel">
          <h3>การชำระเงินล่าสุด</h3>
          {payments.length ? (
          payments.map((p) => (
            <div className="listItem" key={p.id}>
              <div>
                <strong>{p.userName || p.userEmail || "ไม่ระบุสมาชิก"}</strong>
                <p>แพ็กเกจ: {p.plan || "-"}</p>
                <p>จำนวนเงิน: {p.amount || 0} บาท</p>
                <p>วันเวลาโอน: {p.paidAt || "-"}</p>
                <p>เลขอ้างอิง: {p.reference || "-"}</p>
              </div>
              <div>
                <span>{p.status || "pending"}</span>
                {(p.status || "pending") === "pending" && (
                  <div className="actions">
                    <button className="primary" onClick={() => approvePayment(p)}>
                      อนุมัติ
                    </button>
                    <button className="secondary" onClick={() => rejectPayment(p)}>
                      ปฏิเสธ
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
          ) : (
            <p>ยังไม่มีรายการชำระเงิน</p>
          )}
        </div>
      </section>
      <section className="card">
        <h3>จัดการนัดหมาย</h3>
        <div className="list">
          {appointments.length ? (
            appointments.map((appointmentItem) => (
              <div className="listItem" key={appointmentItem.id}>
                <div>
                  <strong>{appointmentItem.userName || "ไม่ระบุชื่อ"}</strong>
                  <p>{appointmentItem.userEmail || "ไม่ระบุอีเมล"}</p>
                  <p>{appointmentItem.caseType || "ไม่ระบุประเภทคดี"}</p>
                  <p>
                    {appointmentItem.appointDate || "ไม่ระบุวันที่"} {appointmentItem.appointTime || ""}
                  </p>
                </div>
                <div className="actions">
                  <span className={"status status-" + (appointmentItem.status || "pending")}>{appointmentStatusLabel(appointmentItem.status)}</span>
                  {appointmentItem.status === "pending" && (
                    <button type="button" onClick={() => confirmAppointment(appointmentItem)}>ยืนยันนัด</button>
                  )}
                  {appointmentItem.status === "confirmed" && (
                    <button type="button" onClick={() => completeAppointment(appointmentItem)}>เสร็จสิ้น</button>
                  )}
                  {["pending", "confirmed"].includes(appointmentItem.status) && (
                    <button type="button" onClick={() => cancelAppointment(appointmentItem)}>ยกเลิกนัด</button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>ยังไม่มีรายการนัดหมาย</p>
          )}
        </div>
      </section>
    </>
  );
}

function Card({ title, value }) {
  return (
    <div className="card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}
