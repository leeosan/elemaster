// ==================== EleMaster Bridge ====================
// Next.js 부모 창과 통신하는 브릿지 스크립트

(function() {
  'use strict';

  const isEmbedded = window.parent !== window;
  let saveTimer = null;

  // 저장 함수 (전역 공개)
  window.__sendSave = function() {
    if (!isEmbedded) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const progObj = (typeof computeProgress === "function") ? computeProgress() : null;
        const progress = (progObj && progObj.total > 0) 
          ? Math.round((progObj.completed / progObj.total) * 100) 
          : 0;
        window.parent.postMessage({
          type: "SAVE_PROGRESS",
          payload: {
            phase: currentPhase,
            wire_data: wires || [],
            progress_pct: progress
          }
        }, "*");
      } catch(e) { console.error("[Bridge] SAVE error:", e); }
    }, 500);
  };

  // LOAD_PROGRESS 수신 → 배선 복원
  window.addEventListener("message", (ev) => {
    if (!ev.data || typeof ev.data !== "object") return;
    if (ev.data.type === "LOAD_PROGRESS") {
      console.log("[Bridge] LOAD_PROGRESS received");
      try {
        const records = ev.data.payload || [];
        const current = records.find(r => String(r.phase) === String(currentPhase));
        if (current && Array.isArray(current.wire_data) && current.wire_data.length > 0) {
          console.log("[Bridge] restoring", current.wire_data.length, "wires for phase", currentPhase);
          wires.length = 0;
          current.wire_data.forEach(w => wires.push(w));
          if (typeof drawWires === "function") drawWires();
          if (typeof updateProgress === "function") updateProgress();
        }
      } catch(e) { console.error("[Bridge] LOAD error:", e); }
    }
  });

  // IFRAME_READY 전송 (부모에게 준비 완료 알림)
  function sendReady() {
    if (isEmbedded) {
      console.log("[Bridge] IFRAME_READY sending");
      window.parent.postMessage({ type: "IFRAME_READY" }, "*");
    }
  }

  if (document.readyState === "complete") {
    sendReady();
  } else {
    window.addEventListener("load", sendReady);
  }

  // drawWires 자동 감싸기 (배선 변경 시 자동 저장)
  function wrapDrawWires() {
    if (typeof window.drawWires !== "function") {
      setTimeout(wrapDrawWires, 100);
      return;
    }
    if (window.__drawWiresWrapped) return;
    const original = window.drawWires;
    window.drawWires = function() {
      const result = original.apply(this, arguments);
      if (typeof window.__sendSave === "function") window.__sendSave();
      return result;
    };
    window.__drawWiresWrapped = true;
    console.log("[Bridge] drawWires wrapped for auto-save");
  }

  wrapDrawWires();
})();