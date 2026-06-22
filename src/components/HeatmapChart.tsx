import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface HeatmapData {
  category: string;
  shift: string;
  value: number;
}

const shifts = ['Morning', 'Afternoon', 'Evening', 'Night'];
const categories = ['Technical', 'Billing', 'General', 'Feedback', 'Urgent'];

const HeatmapChart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Generate sample data
    const data: HeatmapData[] = [];
    categories.forEach(cat => {
      shifts.forEach(shift => {
        data.push({
          category: cat,
          shift: shift,
          value: Math.floor(Math.random() * 100)
        });
      });
    });

    const margin = { top: 30, right: 30, bottom: 50, left: 100 };
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Build X scales and axis:
    const x = d3.scaleBand()
      .range([0, width])
      .domain(shifts)
      .padding(0.05);
    
    svg.append("g")
      .style("font-size", 10)
      .style("font-family", "Inter, sans-serif")
      .style("font-weight", 600)
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select(".domain").remove();

    // Build Y scales and axis:
    const y = d3.scaleBand()
      .range([height, 0])
      .domain(categories)
      .padding(0.05);
    
    svg.append("g")
      .style("font-size", 10)
      .style("font-family", "Inter, sans-serif")
      .style("font-weight", 600)
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove();

    // Build color scale
    const myColor = d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain([1, 100]);

    // create a tooltip
    const tooltip = d3.select("body")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "8px")
      .style("padding", "8px")
      .style("position", "absolute")
      .style("font-size", "10px")
      .style("box-shadow", "0 10px 15px -3px rgba(0,0,0,0.1)");

    const mouseover = function(event: any, d: HeatmapData) {
      tooltip.style("opacity", 1);
      d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1);
    };

    const mousemove = function(event: any, d: HeatmapData) {
      tooltip
        .html(`<b>${d.category}</b><br>${d.shift}: ${d.value}% Efficiency`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
    };

    const mouseleave = function(event: any, d: HeatmapData) {
      tooltip.style("opacity", 0);
      d3.select(this)
        .style("stroke", "none")
        .style("opacity", 0.8);
    };

    // add the squares
    svg.selectAll()
      .data(data, (d: any) => d.shift + ':' + d.category)
      .enter()
      .append("rect")
      .attr("x", (d: HeatmapData) => x(d.shift) || 0)
      .attr("y", (d: HeatmapData) => y(d.category) || 0)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", (d: HeatmapData) => myColor(d.value))
      .style("stroke-width", 2)
      .style("stroke", "none")
      .style("opacity", 0.8)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

    return () => {
        tooltip.remove();
    };
  }, []);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef} className="w-full h-auto" />
    </div>
  );
};

export default HeatmapChart;
