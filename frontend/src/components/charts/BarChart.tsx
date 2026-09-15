"use client";

import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { AXIS_STYLE, GRID_STROKE, TOOLTIP_STYLE } from "./theme";

export interface ChartDatum {
  label: string;
  value: number;
  [key: string]: unknown;
}

export default function BarChart({
  data,
  dataKey = "value",
  xKey = "label",
  color = "#10b981",
  height = 260,
}: {
  data: ChartDatum[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }} className="text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS_STYLE} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={52} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(16,185,129,0.08)" }} />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={0.9} />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
