"use client";
import React, { useState } from "react";
import { logoSrcList } from "@/lib/branding";

type Props = {
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function Logo(props: Readonly<Props>) {
  const { width = 140, height, alt = "Logo", className, style } = props;
  const [index, setIndex] = useState(0);
  const src = logoSrcList[index] || logoSrcList[0];

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      onError={() => setIndex((i) => (i < logoSrcList.length - 1 ? i + 1 : i))}
    />
  );
}