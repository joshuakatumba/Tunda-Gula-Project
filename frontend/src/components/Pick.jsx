import React from "react";

export const Pick = ({ on, ic, t, d, onClick }) => (
  <button className={"pick" + (on ? " on" : "")} onClick={onClick}>
    <span className="ic">{ic}</span><span><span className="t">{t}</span><span className="d">{d}</span></span>
  </button>
);
