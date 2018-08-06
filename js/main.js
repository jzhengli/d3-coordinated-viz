/****/
//module 2-2

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    
    //map frame dimensions
    var width = 960;
    var height = 460;
    
    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    
    //create Albers equal conic projection centered on China
    var projection = d3.geoAlbers()
        .center([0, 35.5])
        .rotate([-103.5, 0, 0])
        .parallels([25, 52])
        .scale(600)
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
    
    //Use Promise to handle parallel calls. Works!
    Promise.all([
        d3.csv("data/China_stats.csv"),
        d3.json("data/Asia_shape.topojson"),
        d3.json("data/China_provinces.topojson")
    ]).then(function(data){
        //--add graticule
        //create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element that will be created
            .enter()
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .style("fill", "none")
            .style("stroke", "#999")
            .style("stroke-width", "1px")
            .attr("d", path);
        
        //--add data
        var csvData = data[0];
        var asia = data[1];
        var china = data[2];
        
//        console.log(csvData); //csv file
//        console.log(asia); //Asia shape
//        console.log(china); //China provinces        
        
        //translate topojson to geojson
        var asiaShape = topojson.feature(asia, asia.objects.Asia_shape),
            chinaProvinces = topojson.feature(china, china.objects.China_provinces).features;
        
        console.log(asiaShape);
        console.log(chinaProvinces);
        
        //add Asia continent to map
        var countries = map.append("path")
            .datum(asiaShape)
            .attr("class", "countries")
            .style("fill", "#FFF")
            .style("stroke", "#CCC")
            .style("stroke-width", "2px")
            .attr("d", path);
        
        //add China provinces to map
        var provinces = map.selectAll(".provinces")
            .data(chinaProvinces)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "provinces " + d.properties.ADMIN_CODE;
            })
            .attr("d", path); 
        
        

        
    });
    
};