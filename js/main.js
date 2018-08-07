/****/
//module 2-2, 2-3

//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

    //pseudo-global variables
    //variables for data join moved to the top
    var attrArray = ["GDP_2017", "Pop_2010", "HDI_2016", "DLI_2012", "Life_Expectancy_2013-2016"];
    var expressed = attrArray[0]; //initial attribute
    
    //begin script when window loads
    window.onload = setMap();

    //set up choropleth map
    function setMap(){

        //map frame dimensions
        var width = window.innerWidth * 0.5,
            height = 460;

        //create new svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        //create Albers equal conic projection centered on China
        var projection = d3.geoAlbers()
            .center([0, 37.5])
            .rotate([-102.5, 0, 0])
            .parallels([50, 40])
            .scale(700)
            .translate([width/2, height/2]);

        //create a path generator
        var path = d3.geoPath()
            .projection(projection);

        //first attempt using d3.queue. Then played with promises. Did not work.
        /*d3.csv("data/China_stats.csv").then(function(csvData){
            //check if csvData is loaded
            console.log(csvData);

            //add Asia continent shape to map
            d3.json("data/Asia_shape.topojson").then(function(asia){
                var asiaShape = topojson.feature(asia, asia.objects.Asia_shape);

                var asia = map.append("path")
                    .datum(asiaShape)
                    .attr("class", "asia")
                    .attr("d", path);
                //create graticule generator
                var graticule = d3.geoGraticule()
                    .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
                //read China_provinces data and convert to geojson
                d3.json("data/China_provinces.topojson").then(function(china){
                //console.log(china);

                var chinaProvinces = topojson.feature(china, china.objects.China_provinces).features;

                //check the converted geojson data
                console.log(chinaProvinces);

                //add China provinces to map
                var provinces = map.selectAll(".provinces")
                    .data(chinaProvinces)
                    .enter()
                    .append("path")
                    .attr("class", function(d){
                        return "provinces " + d.properties.ADMIN_CODE;
                    })
                    .attr("d", path);

                //create graticule lines
    //            var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
    //                .data(graticule.lines()) //bind graticule lines to each element that will be created
    //                .enter()
    //                .append("path") //append each element to the svg as a path element
    //                .attr("class", "gratLines") //assign class for styling
    //                .attr("d", path);

                });

            });
        });
        */

        //New test using promises
        /* 
        d3.csv("data/China_stats.csv").then(function(csvData){
            console.log(csvData);
        }).then(function(){
            d3.json("data/Asia_shape.topojson").then(function(asia){
                console.log(asia);
            });
        }).then(function(){
            d3.json("data/China_provinces.topojson").then(function(china){
                console.log(china);
            });
        })
        */

        //Use Promise to handle parallel calls. Worked!
        Promise.all([
            d3.csv("data/China_stats.csv"),
            d3.json("data/Asia_countries.topojson"),
            d3.json("data/China_provinces.topojson")
        ]).then(function(data){ //this is like a callback funtion in d3.queue
            
            //--place graticule on the map
            setGraticule(map, path);

            //--add data
            let csvData = data[0];
            let asia = data[1];
            let china = data[2];

    //        console.log(csvData); //csv file
    //        console.log(asia); //Asia shape
    //        console.log(china); //China provinces        

            //translate topojson to geojson
            var asiaShape = topojson.feature(asia, asia.objects.Asia_line),
                chinaProvinces = topojson.feature(china, china.objects.China_provinces).features;

    //        console.log(asiaShape);
    //        console.log(chinaProvinces);

            //add Asia countries to map
            var countries = map.append("path")
                .datum(asiaShape)
                .attr("class", "countries")
                .attr("d", path);

            //--join data
            //*variables for data join moved to the top as pseudo-global variable
            chinaProvinces = joinData(chinaProvinces, csvData);
            
            //--add colored data to map
            //create the color scale
            var colorScale = makeColorScale(csvData);
            
            //add enumeration units to the map
            setEnumerationUnits(chinaProvinces, map, path, colorScale);

            //console.log(chinaProvinces);
            
            
            setChart(csvData, colorScale);
            
            
        }); //end of "call back" function

    };//end of set map
    
    //function to set graticule
    function setGraticule(map, path){
        //create graticule generator
        var graticule = d3.geoGraticule()
            .step([8, 8]); //place graticule lines every 5 degrees of longitude and latitude
        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline())//bind graticule background
            .attr("class", "gratBackground") //assign class for style
            .attr("d", path); //project graticule

        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element that will be created
            .enter()
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path);
    }; //end of setGraticule function
    
    //function for joining data
    function joinData(chinaProvinces, csvData){
        //loop through csv to assign each set of csv attribute values to geojson province
        for(let i=0; i<csvData.length; i++){
            var csvProvince = csvData[i]; //the current province
            var csvKey = csvProvince.admin_code; //the csv primary key

            //loop through the geojson provinces to find correct province
            for(let j=0; j<chinaProvinces.length; j++){
                var geojsonProps = chinaProvinces[j].properties; //the current province geojson properties
                var geojsonKey = geojsonProps.ADMIN_CODE; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if(geojsonKey == csvKey){
                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvProvince[attr]); //get csv attribute value
                        geojsonProps[attr] = val;
                    });
                };
            };
        };
        return chinaProvinces;
    }; //end of joinData function
    
    //function to set enumeration units
    function setEnumerationUnits(chinaProvinces, map, path, colorScale){
        //add China provinces to map
        var provinces = map.selectAll(".provinces")
            .data(chinaProvinces)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "provinces " + d.properties.ADMIN_CODE;
            })
            .style("fill", function(d){
                //return colorScale(d.properties[expressed]);
                return choropleth(d.properties, colorScale);
            })
            .attr("d", path);
    }; //end of setEnumerationUnits function
    
    //function to create color scale generator
    function makeColorScale(data){
        var colorClasses = [
            "#ffffb2",
            "#fecc5c",
            "#fd8d3c",
            "#f03b20",
            "#bd0026"           
        ];
        
        //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);
        
//        ////test with quantile color scale
//        //build array of all values of the expressed attribute
//        var domainArray = [];
//        for(let i=0; i<data.length; i++){
//            var val = parseFloat(data[i][expressed]);
//            domainArray.push(val);
//        };
//        
//        //assign array of expressed values as scale domain
//        colorScale.domain(domainArray);
        
        ////use Natural Breaks
        var colorScale = d3.scaleThreshold()
            .range(colorClasses);
        
        //build array of all values of the expressed attribute
        var domainArray = [];
        for(let i=0; i<data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };
        
        //cluster data using ckmeans clustering algorithm to create natural breaks
        var clusters = ss.ckmeans(domainArray, 5);
        //reset domain array to cluster minimus
        domainArray = clusters.map(function(d){
            return d3.min(d);
        });
        //remove first value from domain array to create class breakpoints
        domainArray.shift();
        
        console.log(domainArray);
        
        //assign array of last 4 cluster minimus as domain
        colorScale.domain(domainArray);
        
        return colorScale;
    }; //end of makeColorScale function
    
    //function to test for data value and return color
    function choropleth(props, colorScale){
        //make sure attribute value is a number
        var val = parseFloat(props[expressed]);
        //if attribute value exists, assign a color; otherwise assign grey
        if (typeof val == 'number' && !isNaN(val)){
            return colorScale(val);
        } else {
            return "#CCC";
        };
    }; //end of function choropleth
    
    //function to create coordinated bar chart
    function setChart(csvData, colorScale){
        //chart frame dimensions
        var chartWidth = window.innerWidth * 0.425,
            chartHeight = 473,
            leftPadding = 29,
            rightPadding = 2,
            topBottomPadding = 5,
            chartInnerWidth = chartWidth - leftPadding - rightPadding,
            chartInnerHeight = chartHeight - topBottomPadding * 2,
            translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
        
        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("class", "chart")
            .attr("width", chartWidth)
            .attr("height", chartHeight);
        
        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
        
        //create a scale to size bars proportionally to frame and for axis
        var yScale = d3.scaleLinear()
            .range([463, 0])
            .domain([0, 9000]);
        
        //create bars for each province
        var bars = chart.selectAll(".bars")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return b[expressed] - a[expressed];
            })
            .attr("class", function(d){
                return "bars " + d.admin_code;
            })
            .attr("width", chartWidth / csvData.length - 2)
            .attr("x", function(d, i){
                return i * (chartWidth / csvData.length) + leftPadding;
            })
            .attr("height", function(d){
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            .style("fill", function(d){
                return choropleth(d, colorScale);
            });
        
        //annotate bars with attribute value text
//        var numbers = chart.selectAll(".numbers")
//            .data(csvData)
//            .enter()
//            .append("text")
//            .sort(function(a, b){
//                return b[expressed] - a[expressed];
//            })
//            .attr("class", function(d){
//                return "numbers " + d.admin_code;
//            })
//            .attr("text-anchor", "middle")
//            .attr("x", function(d, i){
//                var fraction = chartWidth / csvData.length;
//                return i * fraction + (fraction -1) / 2; 
//            })
//            .attr("y", function(d){
//                return chartHeight - yScale(parseFloat(d[expressed])) + 5;
//            })
//            .text(function(d){
//                return d[expressed];
//            });
        
        //create chart title
        var chartTitle = chart.append("text")
            .attr("x", 80)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text(expressed.substring(4,8) + " " + expressed.substring(0,3) + " of each province (CN¥ billion)");
        
            
        //create vertical axis generator
        var yAxis = d3.axisLeft(yScale);
    
        //place axis
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);
    
        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
    
    }; //end of function setChart
    
})(); //last line of main.js