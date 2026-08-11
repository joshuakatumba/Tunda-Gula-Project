import React from "react";
import { Req } from "./Req";

export const Head = ({ eyebrow, title, lede, reqs }) => (
  <div className="head">
    <div className="eyebrow">{eyebrow}</div><h1>{title}</h1>
    {lede && <p className="lede">{lede}</p>}
    {reqs && <div className="row" style={{ marginTop: 10, gap: 5 }}>{reqs.map(r => <Req key={r} id={r} />)}</div>}
  </div>
);
