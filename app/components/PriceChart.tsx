"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";

type PricePoint = {
  date: Date;
  value: number;
};

type PriceChartProps = {
  data: PricePoint[];
};

const PriceChart: React.FC<PriceChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)!])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3
      .line<{ date: Date; value: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.value));

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));
  }, []);

  return <svg ref={svgRef} width={600} height={300} />;
};

export default PriceChart;
