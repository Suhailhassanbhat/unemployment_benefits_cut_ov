import * as d3 from 'd3';
let pymChild = null // for embedding

const margin = { top: 30, left: 50, right: 30, bottom: 60 };
const height = 500 - margin.top - margin.bottom;
const width = 700 - margin.left - margin.right;

const svg = d3
	.select('#claims')
	.append('svg')
	.attr('height', height + margin.top + margin.bottom)
	.attr('width', width + margin.left + margin.right)
	.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Parse time
const parseTime = d3.timeParse('%Y-%m-%d');

// Scales
const xPositionScale = d3.scaleLinear().range([0, width]);
const yPositionScale = d3.scaleLinear().range([height, 0]);

// Line here
const federalClaimsLine = d3
	.line()
	.x((d) => xPositionScale(d.datetime))
  	.y((d) => yPositionScale(+d.PEUC_CC));
	  
const puaClaimsLine = d3
	.line()
	.x((d) => xPositionScale(d.datetime))
	.y((d) => yPositionScale(+d['PUA_CC']));

const stateClaimsLine = d3
	.line()
	.x((d) => xPositionScale(d.datetime1))
  	.y((d) => yPositionScale(+d['Insured Unemployment Rate']));

const initialClaimsLine = d3
	  	.line()
	  	.x((d) => xPositionScale(d.datetime1))
		.y((d) => yPositionScale(+d['Initial Claims']));

const finalpaymentsLine = d3
	.line()
	.x((d) => xPositionScale(d.month))
	.y((d) => yPositionScale(+d.first_payments));

// Read data
Promise.all([d3.csv(require('/data/pandemic_claims.csv')),
	d3.csv(require('/data/state_claims.csv')),
	d3.csv(require('/data/claims_payments.csv'))
	])
	.then(ready)
  	.catch(err => console.log('Failed on', err))

function ready([pandemic_data, state_data, payments_data]) {

	pandemic_data.forEach((d) => {
		d.datetime = parseTime(d['Reflect_Date']);
  	});
	state_data.forEach((d) => {
		d.datetime1 = parseTime(d['Filed week ended']);
  	});

	payments_data.forEach((d) => {
		d.month = parseTime(d['Month']);
  	});




	// pandemic data filter
	const pua_data = pandemic_data.filter(function(d){return d.Reflect_Date > '2020-09-30' && d.State != 'OH'})
	const oh_pua_data = pandemic_data.filter(function(d){return (d.Reflect_Date > '2020-09-30') && (d.State == 'OH')})

	  // Nest data
	const pandemicNested = d3.nest().key(function(d){return d.State}).entries(pandemic_data)
	const pua_nested = d3.nest().key(function(d){return d.State}).entries(pua_data)
	const stateNested = d3.nest().key(function(d){return d.State}).entries(state_data)
	const paymentsNested = d3.nest().key(function(d){return d.state}).entries(payments_data)

	console.log(payments_data)

  	const peuc_claims = pandemic_data.map((d) => +d['PEUC_CC']);
  	const dates = pandemic_data.map((d) => d.datetime);
	const claim_dates = state_data.map((d) => d.datetime1);
	const months = payments_data.map((d) => d.month);
	const pua_claims = pua_data.map((d) => +d['PUA_CC']);
	const ohpua_claims = oh_pua_data.map((d) => +d['PUA_CC']);
	const insured_unemploy_rate = state_data.map((d) => +d['Insured Unemployment Rate']);
	const initial_claims = state_data.map((d) => +d['Initial Claims']);
	const first_payments = payments_data.map((d) => +d.first_payments);

	// update scales
  	const allDates = d3.extent(dates)
	const allfilingDates = d3.extent(claim_dates)
  	const filteredDates = [parseTime('2020-09-30'), parseTime('2021-06-05')]
	const allMonths = d3.extent(months)


	xPositionScale.domain(allDates);
  	yPositionScale.domain([0, d3.max(peuc_claims)+10000]);


	// draw axis

	const yOptions = d3
		.axisLeft(yPositionScale)
		.tickPadding(15)
		.ticks(5);
	const yAxis = svg.append('g').attr('class', 'axis y-axis').call(yOptions);

	const xOptions = d3.axisBottom(xPositionScale);
	const xAxis = svg
		.append('g')
		.attr('class', 'axis x-axis')
    .attr('transform', 'translate(0,' + height + ')').call(xOptions);

	
	// draw PEUC LINE
  	const peucLine = svg
						.selectAll('.peuc_claims')
						.data(pandemicNested)
						.enter()
						.append('path')
						.attr('class','peuc_claims')
						.attr('d', (d) => federalClaimsLine(d.values))
						.attr('stroke-width', 2)
						.attr('fill', 'none')
						.attr('stroke', function(d) {
							if (
							  d.key === 'KY'
							) {
							  return '#de2d26'
							}
							if ( d.key === 'OH') {
							  return 'slateblue'
							} else {
							  return 'orange'
							}
						  })
						.raise()

	// DRAW PUA LINE
	const puaLine = svg
						.selectAll('.pua_claims')
						.data(pua_nested)
						.enter()
						.append('path')
						.attr('class','pua_claims')
						.attr('d', (d) => puaClaimsLine(d.values))
						.attr('stroke-width', 2)
						.attr('fill', 'none')
						.attr('stroke', function(d) {
							if (
							  d.key === 'KY'
							) {
							  return '#de2d26'
							}
							if ( d.key === 'OH') {
							  return 'slateblue'
							} else {
							  return 'orange'
							}
						  })
						.attr('opacity', 0)
					
	// DRAW OH PUA LINE
	const ohpuaLine = svg
						.append('path')
						.datum(oh_pua_data)
						.attr('class','ohpua_claims')
						.attr('d', function(d){return puaClaimsLine(d)})
						.attr('stroke-width', 2)
						.attr('fill', 'none')
						.attr('stroke', 'slateblue')
						.attr('opacity', 0)

	// Draw rectangles 
	const initialclaimsLine = svg
								.selectAll('.insured_unemploy_rate')
								.data(stateNested)
								.enter()
								.append('path')
								.attr('class','insured_unemploy_rate')
								.attr('d', (d) => stateClaimsLine(d.values))
								.attr('stroke-width', 2)
								.attr('fill', 'none')
								.attr('stroke', function(d) {
									if (
									  d.key === 'Kentucky'
									) {
									  return '#de2d26'
									}
									if ( d.key === 'Ohio') {
									  return 'slateblue'
									} else {
									  return 'orange'
									}
								  })
								.attr('opacity', 0)

	const stateclaimsLine = svg
								.selectAll('.initial_claims')
								.data(stateNested)
								.enter()
								.append('path')
								.attr('class','initial_claims')
								.attr('d', (d) => initialClaimsLine(d.values))
								.attr('stroke-width', 2)
								.attr('fill', 'none')
								.attr('stroke', function(d) {
									if (
										d.key === 'Kentucky'
									) {
										return '#de2d26'
									}
									if ( d.key === 'Ohio') {
										return 'slateblue'
									} else {
										return 'orange'
									}
									})
								.attr('opacity', 0)
	const paymentsLine = svg
							.selectAll('.first_payment')
							.data(paymentsNested)
							.enter()
							.append('path')
							.attr('class','first_payment')
							.attr('d', (d) => finalpaymentsLine(d.values))
							.attr('stroke-width', 2)
							.attr('fill', 'none')
							.attr('stroke', function(d) {
								if (
									d.key === 'KY'
								) {
									return '#de2d26'
								}
								if ( d.key === 'OH') {
									return 'slateblue'
								} else {
									return 'orange'
								}
								})
							.attr('opacity', 0)


	/// /text labels////////////////////////////////
	
	const y_label = svg.append('text')
						.attr('class', 'y_label')
						.text('Benefit Claims')
						.attr('font-size', 12)

	const insured_rate_label = svg.append('text')
		.attr('class', 'insured_rate_label')
		.text('Insured Unemployment Rate')
		.attr('font-size', 0)

	const first_payments_label = svg.append('text')
		.attr('class', 'insured_rate_label')
		.text('First Payments Count')
		.attr('font-size', 0)


	// ///////////////////STEP START HERE///////////////////////////////////////////////
	// name our steps
	const reset= d3.select('#reset')
	const puaClaims = d3.select('#pua_claims');
	const ohpuaClaims = d3.select('#ohpua_claims');
	const initialClaims = d3.select('#insured_unemploy_rate');
	const stateClaims = d3.select('#initial_claims');
	const finalPayments = d3.select('#first_payments');

	reset.on('stepin', function () {
		xPositionScale.domain(allDates);
		yPositionScale.domain([0, d3.max(peuc_claims)+10000]);
		yAxis.call(yOptions)
      	xAxis.call(xOptions)
		peucLine.transition().attr('d', (d) => federalClaimsLine(d.values)).transition().attr('opacity', 1)
		puaLine.transition().attr('opacity', 0)
		y_label.attr('font-size', 12)
		insured_rate_label.attr('font-size', 0)


	})

	puaClaims.on('stepin', function () {
		xPositionScale.domain(filteredDates);
		yPositionScale.domain([0, d3.max(pua_claims)+15000]);
		yAxis.call(yOptions)
      	xAxis.call(xOptions)
		puaLine.transition().attr('d', (d) => puaClaimsLine(d.values)).transition().attr('opacity',1)
		peucLine.transition().attr('opacity', 0)
		ohpuaLine.transition().attr('opacity', 0)
		y_label.attr('font-size', 12)
		insured_rate_label.attr('font-size', 0)


	})

	ohpuaClaims.on('stepin', function () {
		xPositionScale.domain(filteredDates);
		yPositionScale.domain([0, d3.max(ohpua_claims)+100000]);
		yAxis.call(yOptions)
      	xAxis.call(xOptions)
		peucLine.transition().attr('opacity', 0)
		puaLine.transition().attr('opacity', 0)
		initialclaimsLine.transition().attr('opacity', 0)
		ohpuaLine.transition().attr('d', (d) => puaClaimsLine(d)).transition().attr('opacity',1)
		y_label.attr('font-size', 12)
		insured_rate_label.attr('font-size', 0)



	})
	initialClaims.on('stepin', function () {
		xPositionScale.domain(allfilingDates);
		yPositionScale.domain([0, d3.max(insured_unemploy_rate) +5]);
		yAxis.call(yOptions)
      	xAxis.call(xOptions)
		initialclaimsLine.transition().attr('d', (d) => stateClaimsLine(d.values)).transition().attr('opacity',1)
		peucLine.transition().attr('opacity', 0)
		puaLine.transition().attr('opacity', 0)
		ohpuaLine.transition().attr('opacity',0)
		stateclaimsLine.transition().attr('opacity',0)
		y_label.attr('font-size', 0)
		insured_rate_label.attr('font-size', 12)

		

	})

	stateClaims.on('stepin', function () {
		xPositionScale.domain(allfilingDates);
		yPositionScale.domain([0, d3.max(initial_claims) +50000]);
		yAxis.call(yOptions)
      	xAxis.call(xOptions)
		stateclaimsLine.transition().attr('d', (d) => initialClaimsLine(d.values)).transition().attr('opacity',1)
		peucLine.transition().attr('opacity', 0)
		puaLine.transition().attr('opacity', 0)
		ohpuaLine.transition().attr('opacity',0)
		initialclaimsLine.transition().attr('opacity',0)
		paymentsLine.transition().attr('opacity',0)
		y_label.attr('font-size', 12)
		insured_rate_label.attr('font-size', 0)
		first_payments_label.attr('font-size', 0)


	})
		
	finalPayments.on('stepin', function () {
		xPositionScale.domain(allMonths);
		yPositionScale.domain([0, d3.max(first_payments) +20000]);
		yAxis.call(yOptions)
      	xAxis.call(xOptions)
		paymentsLine.transition().attr('d', (d) => finalpaymentsLine(d.values)).transition().attr('opacity',1)
		peucLine.transition().attr('opacity', 0)
		puaLine.transition().attr('opacity', 0)
		ohpuaLine.transition().attr('opacity',0)
		initialclaimsLine.transition().attr('opacity',0)
		stateclaimsLine.transition().attr('opacity',0)
		y_label.attr('font-size', 0)
		first_payments_label.attr('font-size', 12)
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
					.tickFormat(d3.format('~s'))
			)
		xAxis
			.call(
				xOptions
					.ticks(newWidth / 50)
					.tickPadding(15)
					.tickFormat(d3.timeFormat('%b %d'))
			)
    
		// Update LINES HERE
		peucLine.attr('d', (d) => federalClaimsLine(d.values))
		puaLine.attr('d', (d) => puaClaimsLine(d.values))
		ohpuaLine.attr('d', puaClaimsLine)
		initialclaimsLine.attr('d', (d) => stateClaimsLine(d.values))
		stateclaimsLine.attr('d', (d) => initialClaimsLine(d.values))
		paymentsLine.attr('d', (d) => finalpaymentsLine(d.values))

		y_label.attr('x', -margin.left+10)
			.attr('y', margin.top-40);
		insured_rate_label.attr('x', -margin.left+10)
			.attr('y', margin.top-40);
		first_payments_label.attr('x', -margin.left+10)
		.attr('y', margin.top-40);

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
