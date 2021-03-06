


dc.calendarChart = function(parent, chartGroup){
	/**
	 * @WARN NEED RANGE
	 * @type {dc.marginMixin}
	 * @private
	 */

	let _chart = dc.marginMixin(dc.baseMixin({}));
	let width = 848,
		height = 120,
		cellSize = 16; // cell size

	let day = d3.time.format('%w'),
		week = d3.time.format('%U'),
		percent = d3.format('.1%'),
		format = d3.time.format('%Y-%m-%d'),
		fullMonth = d3.time.format('%b');

	let weekDay = {
		'M': 2,
		'W': 4,
		'F': 6
	};

	const emptyColor = 'white';
	const top100Color = '#004b00'; //nearly dark green
	const top50Color = 'green';
	const bottom10Color = 'red';
	const range10Color = 'yellow';
	const range40Color = 'orange';

	let colors = [emptyColor, bottom10Color, range10Color, range40Color, top50Color, top100Color];

	_chart._doRedraw = function(){
		_chart._doRender();
		return _chart;
	};

	_chart._doRender = function(){
		/**
		 * Clear before re-render
		 */
		d3.select('#' + _chart.anchorName())
		  .selectAll('svg')
		  .remove();

		let xSVG =
			d3.select('#' + _chart.anchorName())
			  .selectAll('svg')
			  .data(_chart.range)
			  .enter()
			  .append('svg')
			  .style('padding', '3px');
		let svg =
			xSVG
				.attr('width', width + _chart.margins().left + (cellSize * 3))
				.attr('height', height + _chart.margins().top + cellSize)
				.append('g')
				.attr('transform', 'translate(' + _chart.margins().left + ',' + _chart.margins().top + ')');

		svg.append('text')
		   .attr('transform', 'translate(-16,' + cellSize * 3.5 + ')rotate(-90)')
		   .style('text-anchor', 'middle')
		   .text(function(d){
			   return d;
		   });


		if(_chart.renderTitle()){
			let dowLabel =
				svg.selectAll('.dowLabel')
				   .data(function(d){
					   return ['M', 'W', 'F'];
				   })
				   .enter().append('text')
				   .attr('transform', function(d){

					   return 'translate(-15,' + parseInt((cellSize * weekDay[d]) - 3) + ')';
				   })
				   .text(function(d){
					   return d;
				   })
				   .attr('style', 'font-weight : bold');
		}

		let rect =
				svg.selectAll('.day')
				   .data(function(d){
					   return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1));
				   })
				   .enter()
				   .append('rect')
				   .attr('class', 'day')
				   .attr('width', cellSize)
				   .attr('height', 16)
				   .attr('x', function(d){
					   return week(d) * cellSize;
				   })
				   .attr('y', function(d){
					   return day(d) * cellSize;
				   })
				   .style('fill', d =>{
					   return 'white';
				   })
			;
		window.rect = rect;

		if(_chart.renderTitle()){
			rect
				.append('title')
				.text(function(d){
					return d;
				});
		}

		let monthLabel =
			svg.selectAll('.monthLabel')
			   .data(function(d){
				   return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1));
			   })
			   .enter().append('text')
			   .text(function(d){
				   return fullMonth(d);
			   })
			   .attr('x', function(d){
				   return week(d) * cellSize /*+ cellSize*/;
			   })
			   .attr('y', -3)
			   .attr('class', 'monthLabel');

		let data =
			d3.nest()
			  .key(function(d){
				  return d.key;
			  })
			  .rollup(function(d){
				  return _chart.valueAccessor()(d);
			  })
			  .map(_chart.data());

		let valArr = _chart.group().all().map(c =>{
			return c.value
		});

		let maxVal = valArr.reduce((x, y) =>{
			return x > y ? x : y;
		});
		console.log('MAX VAL: ', maxVal);
		let emptyVal = 0;
		let bottom10Val = maxVal * 0.1 - 1;
		let range10Val = maxVal * 0.1;
		let range40Val = maxVal * 0.4;
		let top50Val = maxVal * 0.5;
		let top100Val = maxVal;

		let domainRange = [emptyVal, bottom10Val, range10Val, range40Val, top50Val, top100Val];

		// if (!color) {
		//     color = d3.scale.quantile()
		//         .domain(domainRange)
		//         .range(colors);
		// }

		const heatColorMapping = function(d){

			return d3.scale.linear()
			         .domain(domainRange)
			         .range([emptyColor, bottom10Color, range10Color, range40Color, top50Color, top100Color])(d);
		};

		// heatColorMapping.domain = function(){
		//     return [0,1];
		// };

		/**
		 * Only apply on who has data
		 */
		rect.filter(function(d){
			let date = simpleDate(d);
			return data[date];
		})
		    .style('fill', function(d){
			    let date = simpleDate(d);
			    let val = data[date];
			    if(!val){
				    val = 0;
			    }
			    let color = heatColorMapping(val);
			    return color;
		    })
		    .on('click', onClick);

		if(_chart.renderTitle()){
			rect.filter(function(d){
				let date = simpleDate(d);
				return data[date];
			})
			    .select('title')
			    .text(function(d){
				    let date = simpleDate(d);
				    return data[date].toFixed(2);
			    });
		}

		_chart.xxx = function(w){
			let cellSize = Math.floor(w / 53);
			rect.attr('width', cellSize);
			rect.attr('x', function(d){
				return week(d) * cellSize;
			});
			xSVG.attr('width', w);
			monthLabel.attr('x', function(d){
				return week(d) * cellSize;
			});
			// window.xSVG = xSVG;
		};

		// _chart.width = function(){
		// 	console.log('hello width function');
		// };

		return _chart;
	};

	function onClick(d, i){
		let dateClicked = simpleDate(d);
		console.log('fuck you');
		_chart.group().all().forEach(function(datum){
			if(datum.key === dateClicked){
				_chart.onClick(datum, i);
			}
		});

	}

	function prefixZero(value){
		let s = value + '';
		if(s.length === 1){
			return '0' + value;
		}else{
			return value;
		}
	}

	function simpleDate(date){
		return date.getFullYear() + '-' + prefixZero(date.getMonth() + 1) + '-' + prefixZero(date.getDate());
	}

	_chart.rangeYears = function(range){
		_chart.range = d3.range(range[0], range[1]);
		return _chart;
	}


	window.chartX = _chart;

	return _chart.anchor(parent, chartGroup);
};
