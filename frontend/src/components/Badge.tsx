import React from "react";

export const Badge = ({ tone = "b-grey", children }) => <span className={"badge " + tone}>{children}</span>;
