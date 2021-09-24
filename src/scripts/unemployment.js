import * as d3 from 'd3';
let pymChild;

const margin = { top: 40, left: 40, right: 60, bottom: 40 };
const height = 500 - margin.top - margin.bottom;
const width = 700 - margin.left - margin.right;

const svg = d3
	.select('#unemployment_rate')
	.append('svg')
	.attr('height', height + margin.top + margin.bottom)
	.attr('width', width + margin.left + margin.right)
	.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Parse time
const parseMonth = d3.timeParse('%Y-%m');

// Scales
const xPositionScale = d3.scaleLinear().range([0, width]);
const yPositionScale = d3.scaleLinear().range([height, 0]);

const laborLine = d3.line()
					.x((d) => xPositionScale(d.month))
					.y((d) => yPositionScale(+d.unemployment_rate));

// Read data



Promise.all([d3.csv(require('/data/unemployment_state.csv'))
	])
	.then(ready)
  	.catch(err => console.log('Failed on', err))

function ready([unemployment_data]) {

	unemployment_data.forEach(function(d){
		d.month = parseMonth(d.period)
	})

	unemployment_data = unemployment_data.filter(function(d){return d.period > "2018-12"})

	const allMonths = unemployment_data.map(d => d.month) 
	const unemployment_rate = unemployment_data.map(d => +d.unemployment_rate) 

	// Group data
	const nestedData = d3.nest().key(function(d){return d.state}).entries(unemployment_data)

	//Update scales 
	xPositionScale.domain(d3.extent(allMonths))
	yPositionScale.domain([0, d3.max(unemployment_rate)+5])

	// draw axis

	const yOptions = d3
		.axisLeft(yPositionScale)
		.tickPadding(15)
		.ticks(5);
	const yAxis = svg.append('g').attr('class', 'axis y-axis').call(yOptions).attr('opacity', 1);

	const xOptions = d3.axisBottom(xPositionScale);
	const xAxis = svg
		.append('g')
		.attr('class', 'axis x-axis')
    	.attr('transform', 'translate(0,' + height + ')').call(xOptions).attr('opacity', 1);
  
	// Draw Line Here

	const unemployLine = svg
							.selectAll('labor_line')
							.data(nestedData)
							.enter()
							.append('path')
							.attr('class', 'labor_line')
							.attr('d', function(d) {
							return laborLine(d.values)
							})
							.attr('stroke', function(d){
								if (d.key === 'KY'){
									return 'orange'
								} 
								if (d.key === 'OH'){
									return 'indianred'
								}
								if (d.key === 'WV'){
									return 'slateblue'
								}
								else{return 'steelblue'}								
							}			
							)
							.attr('stroke-width', 2)
							.attr('fill', 'none')
							.attr('opacity', 0.9)
							.raise()
	/// /text labels////////////////////////////////
	
	const y_label = svg.append('text')
						.attr('class', 'y_label')
						.text('Unemployment rate')
						.attr('font-size', 12)
	// const stateUnemployHeadline = svg
	// 								.append('text')
	// 								.html("COVID-19 pandemic shook job market")
	// 								.attr('font-size', 18)
	// 								.attr('font-weight', 'bold')

	const stateUnemploySubhead = svg
									.append('text')
									.html("Monthly Data as of May 2021")
									.attr('font-size', 12)


// draw labels for Ohio Valley States
	const stateLabels = svg
							.selectAll('state_labels')
							.data(nestedData)
							.enter()
							.append('text')
							.attr('class', 'state_labels')
							.text(d => d.key)
							.style('text-anchor', 'start')
							.attr('font-size', '12')
							.attr('fill', function(d){
									if (d.key === 'KY'){
										return 'orange'
									} 
									if (d.key === 'OH'){
										return 'indianred'
									}
									if (d.key === 'WV'){
										return 'slateblue'
									}
									else{return 'steelblue'}								
								})

	// resize function + on start
	function render() {
		const svgContainer = svg.node().closest('div');
		const svgWidth = svgContainer.offsetWidth;
		// Do you want it to be full height? Pick one of the two below
		const svgHeight = height + margin.top + margin.bottom;
		// const svgHeight = window.innerHeight

		const actualSvg = d3.select(svg.node().closest('svg'));
		actualSvg.attr('width', svgWidth).attr('height', svgHeight);

		const newWidth = svgWidth - margin.left - margin.right;
		const newHeight = svgHeight - margin.top - margin.bottom;

		// Update our scale
		xPositionScale.range([0, newWidth]);
		yPositionScale.range([newHeight, 0]);

		// axis updated
		yAxis
			.call(
				yOptions
					.tickSizeInner(-newWidth)
					.tickPadding(10)
					.ticks(5)
					.tickFormat(d => d + "%")
			)

		xAxis
			.call(
				xOptions
					.ticks(newWidth / 70)
					.tickPadding(15)
					.tickFormat(d3.timeFormat('%b, %Y'))
			)

		// Update assets Here
		unemployLine.attr('d', function(d) {
						return laborLine(d.values)
						})

		// stateUnemployHeadline.attr('x', -margin.left+10)
		// 			.attr('y', -50);

		stateUnemploySubhead.attr('x', -margin.left+10)
					.attr('y', 0);

		y_label.attr('x', -margin.left+10)
					.attr('y', 20);
		stateLabels
				.attr('x', function(d) {
					return xPositionScale(d.values[28].month)
				})
				.attr('y', function(d) {
					return yPositionScale(+d.values[28].unemployment_rate)
				  })
				.attr('dx', 5)
				.attr('dy', function(d){
					if (d.key === 'KY'){
						return 10
					} 
					if (d.key === 'OH'){
						return 5
					}
					if (d.key === 'WV'){
						return 5
					}
					else{return 0}								
				})

		//   // send the height to our embed
		if (pymChild) pymChild.sendHeight();
	}

	// // kick off the graphic and then listen for resize events
	render();
	window.addEventListener('resize', render);

	// // for the embed, don't change!
	if (pymChild) pymChild.sendHeight();
	pymChild = new pym.Child({ polling: 200, renderCallback: render });
}
