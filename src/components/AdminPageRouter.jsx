import { useEffect } from "react";

const MENU_MAP = [
  { label: "ข้อมูลสมาชิก", key: "members" },
  { label: "คำถามปรึกษา", key: "questions" },
  { label: "จัดการสมาชิก", key: "member-manager" },
  { label: "การชำระเงิน", key: "payments" },
  { label: "จัดการนัดหมาย", key: "appointments" },
];

const HEADINGS = {
  members: ["สมาชิกทั้งหมด", "สมาชิกล่าสุด"],
  questions: ["คำถามล่าสุด", "คำถามใหม่"],
  "member-manager": ["จัดการสิทธิสมาชิก"],
  payments: ["การชำระเงินล่าสุด"],
  appointments: ["จัดการนัดหมาย", "รายการนัดหมาย", "นัดหมายทั้งหมด"],
};

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function findMenu(label) {
  return Array.from(document.querySelectorAll("a, button")).find(
    (element) => cleanText(element.textContent) === label,
  );
}

function findHeading(candidates) {
  return Array.from(
    document.querySelectorAll("h1, h2, h3, h4, strong, .sectionHead"),
  ).find((element) => {
    const text = cleanText(element.textContent);
    return candidates.some(
      (candidate) => text === candidate || text.includes(candidate),
    );
  });
}

function ancestors(element) {
  const result = [];
  let current = element;
  while (current) {
    result.push(current);
    current = current.parentElement;
  }
  return result;
}

function commonAncestor(left, right) {
  if (!left || !right) return null;
  const rightSet = new Set(ancestors(right));
  return ancestors(left).find((item) => rightSet.has(item)) || null;
}

function directChildUnder(element, ancestor) {
  if (!element || !ancestor) return null;
  let current = element;
  while (current.parentElement && current.parentElement !== ancestor) {
    current = current.parentElement;
  }
  return current.parentElement === ancestor ? current : null;
}

function panelFor(heading) {
  if (!heading) return null;
  return (
    heading.closest("section.panel, .adminPanel") ||
    heading.closest("section, article") ||
    heading.parentElement
  );
}

function findSummary() {
  return Array.from(document.querySelectorAll("div"))
    .filter((element) => {
      const text = cleanText(element.textContent);
      return (
        text.includes("สมาชิกทั้งหมด") &&
        text.includes("คำถามทั้งหมด") &&
        text.includes("การชำระเงินทั้งหมด")
      );
    })
    .sort(
      (left, right) =>
        left.querySelectorAll("*").length -
        right.querySelectorAll("*").length,
    )[0] || null;
}

export default function AdminPageRouter() {
  useEffect(() => {
    let currentPage = window.location.hash.replace("#admin-", "");
    if (!HEADINGS[currentPage]) currentPage = "members";
    let applying = false;

    function applyPage(key, updateHistory = false, replace = false) {
      if (applying) return;
      applying = true;
      currentPage = HEADINGS[key] ? key : "members";

      const menus = MENU_MAP.map((item) => ({
        ...item,
        element: findMenu(item.label),
      })).filter((item) => item.element);

      const headings = Object.fromEntries(
        Object.entries(HEADINGS).map(([pageKey, candidates]) => [
          pageKey,
          findHeading(candidates),
        ]),
      );

      const shared = commonAncestor(headings.questions, headings.payments);
      const questionColumn = directChildUnder(headings.questions, shared);
      const paymentColumn = directChildUnder(headings.payments, shared);
      const sharedPanel = shared?.closest("section.panel, .adminPanel");

      const blocks = {
        members: panelFor(headings.members),
        "member-manager": panelFor(headings["member-manager"]),
        appointments: panelFor(headings.appointments),
      };

      Object.entries(blocks).forEach(([pageKey, block]) => {
        if (!block) return;
        const visible = pageKey === currentPage;
        block.style.setProperty("display", visible ? "" : "none", "important");
        block.setAttribute("aria-hidden", visible ? "false" : "true");
      });

      if (questionColumn && paymentColumn) {
        const showQuestions = currentPage === "questions";
        const showPayments = currentPage === "payments";
        questionColumn.style.setProperty(
          "display",
          showQuestions ? "" : "none",
          "important",
        );
        paymentColumn.style.setProperty(
          "display",
          showPayments ? "" : "none",
          "important",
        );
        questionColumn.setAttribute("aria-hidden", showQuestions ? "false" : "true");
        paymentColumn.setAttribute("aria-hidden", showPayments ? "false" : "true");

        if (sharedPanel) {
          const showShared = showQuestions || showPayments;
          sharedPanel.style.setProperty(
            "display",
            showShared ? "" : "none",
            "important",
          );
          sharedPanel.setAttribute("aria-hidden", showShared ? "false" : "true");
        }
      }

      const summary = findSummary();
      if (summary) {
        summary.style.setProperty("display", "none", "important");
      }

      menus.forEach(({ key: menuKey, element }) => {
        const active = menuKey === currentPage;
        element.classList.toggle("admin-menu-active", active);
        element.setAttribute("aria-current", active ? "page" : "false");
      });

      if (updateHistory) {
        const nextHash = `#admin-${currentPage}`;
        if (window.location.hash !== nextHash) {
          const method = replace ? "replaceState" : "pushState";
          window.history[method]({ adminPage: currentPage }, "", nextHash);
        }
      }

      applying = false;
    }

    const clickHandler = (event) => {
      const control = event.target.closest("a, button");
      if (!control) return;
      const menu = MENU_MAP.find(
        (item) => cleanText(control.textContent) === item.label,
      );
      if (!menu) return;
      event.preventDefault();
      applyPage(menu.key, true, false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const historyHandler = () => {
      const requested = window.location.hash.replace("#admin-", "");
      applyPage(HEADINGS[requested] ? requested : "members", false, true);
    };

    // Reapply visibility after React replaces list elements.
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (applying || scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        applyPage(currentPage, false, true);
      });
    });

    document.addEventListener("click", clickHandler);
    window.addEventListener("popstate", historyHandler);
    observer.observe(document.body, { childList: true, subtree: true });

    applyPage(currentPage, true, true);

    return () => {
      document.removeEventListener("click", clickHandler);
      window.removeEventListener("popstate", historyHandler);
      observer.disconnect();
    };
  }, []);

  return null;
}
