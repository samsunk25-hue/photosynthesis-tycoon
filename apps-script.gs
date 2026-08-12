/**
 * 수행평가 제출물을 선생님 구글 시트에 쌓는 다리(Google Apps Script).
 *
 * 쓰는 법
 *  1) 내 드라이브에서 스프레드시트를 하나 만든다 (이름은 아무거나, 예: 수행평가 제출물)
 *  2) 그 시트에서  확장 프로그램 → Apps Script  를 연다
 *  3) 편집기의 코드를 모두 지우고 이 파일 내용을 붙여넣는다
 *  4) 오른쪽 위 [배포] → [새 배포] → 유형 ⚙ → [웹 앱]
 *       - 실행 계정: 나
 *       - 액세스 권한: 모든 사용자        ← 학생이 로그인하지 않아도 보낼 수 있어야 한다
 *  5) [배포] 를 누르고 권한을 허용한 뒤, 나오는 '웹 앱 URL' 을 복사한다
 *       (https://script.google.com/macros/s/AKfycb.../exec 모양)
 *  6) 그 URL 을 알려 주면 앱이 제출할 때마다 이리로 보내도록 붙인다
 *
 * 주의 — [새 배포] 로 만든 URL 만 쓰인다. 코드를 고친 뒤에는
 *       [배포] → [배포 관리] → 연필(수정) → 버전 '새 버전' → [배포] 를 해야 반영된다.
 */

/** 학생 앱이 제출을 보낼 때 실행된다 */
function doPost(e) {
  var lock = LockService.getScriptLock();     // 여러 명이 동시에 내도 줄이 꼬이지 않게
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // 첫 줄에 제목이 없으면 만들어 둔다
    if (sh.getLastRow() === 0) {
      sh.appendRow([
        '제출 시각', '학번', '환경 요인', '소요 시간(분:초)',
        '문항1 가설', '문항2 독립 변인', '문항2 종속 변인', '문항2 통제 변인',
        '문항3 실험 과정', '결론', '결과 해석',
        '고쳐 쓴 횟수', '틀린 시도', '판'
      ]);
      sh.setFrozenRows(1);
    }

    var sec = Math.round((d.took || 0) / 1000);
    var 시간 = Math.floor(sec / 60) + '분 ' + (sec % 60) + '초';

    sh.appendRow([
      new Date(d.at || Date.now()),
      "'" + (d.no || ''),                       // 학번 앞의 0 이 사라지지 않게
      d.factor || '',
      시간,
      d.hyp || '',
      d.indep || '',
      d.dep || '',
      (d.ctrl || []).join('\n'),
      (d.steps || []).map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n'),
      d.concl || '',
      (d.interp || []).join('\n'),
      d.edits || 0,
      d.wrong || 0,
      d.build || ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
                         .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/** 배포가 살아 있는지 눈으로 확인할 때 (주소를 그냥 열어 보면 이 글이 뜬다) */
function doGet() {
  return ContentService.createTextOutput('수행평가 제출 받는 곳 — 잘 살아 있습니다.');
}
