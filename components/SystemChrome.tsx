import type { ReactNode } from "react";

export function SystemHeader() {
  return (
    <header className="boot-header">
      <span className="boot-nerv">NERV</span>
      <span>特殊機関直属<br />汎用人型決戦兵器 支援システム</span>
      <span className="boot-header-code">PROTOCOL 01<br />TOKYO-3 / GEOFRONT</span>
    </header>
  );
}

export function SystemFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="boot-footer">
      <span>内部電源接続 <b>●</b> INTERNAL POWER<br />MAGI・第七世代有機コンピュータ</span>
      {children}
    </footer>
  );
}
