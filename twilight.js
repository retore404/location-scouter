//leaflet OSM map
var polygon;
var mymap;
var latlngs;
var centerpin;
function init() {
    
    // create a map in the "map_id" div,
    // set the view to a given place and zoom
    //var mymap = L.map('mapid')
    mymap = L.map('mapid');
    mymap.setView([35.44998607555596,139.64607417583468], 15);
    
    
    // add an OpenStreetMap tile layer
    var tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png ', {
	  attribution : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	  maxZoom: 18,
	  });
    tileLayer.addTo(mymap);
    latlngs = [[35.44998607555596,139.64607417583468],[35.53012797607202,139.5956474316194],[35.53012797607202,139.69650092004994]];
    polygon = L.polygon(latlngs, {color: 'red'}).addTo(mymap);
    centerpin = L.marker([35.44998607555596,139.64607417583468]).addTo(mymap);
    //マップクリック時にその地点を中心点に据える
    mymap.on('click', function(e) {      
      let clicked_position= e.latlng;
      setPosition(clicked_position['lat'], clicked_position['lng']);
      calc();       
    });
    // zoom the map to the polygon
    //mymap.fitBounds(polygon.getBounds());
}

function changeDirection(){
  let direction = document.getElementById('direction').value;
  if(direction=='0'){
    document.getElementById('direc_output').value='0°(北)';
  } else if (direction=='45') {
    document.getElementById('direc_output').value='45°(北東)';
  } else if (direction=='90') {
    document.getElementById('direc_output').value='90°(東)';
  } else if (direction=='135') {
    document.getElementById('direc_output').value='135°(南東)';
  } else if (direction=='180') {
    document.getElementById('direc_output').value='180°(南)';
  } else if (direction=='225') {
    document.getElementById('direc_output').value='225°(南西)';
  } else if (direction=='270') {
    document.getElementById('direc_output').value='270°(西)';
  } else if (direction=='315') {
    document.getElementById('direc_output').value='315°(北西)';
  } else {
    document.getElementById('direc_output').value=direction;
  }

  calc();

}

function getViewingAngle(focal_length){
    var radian =  2 * Math.atan(36/(2*focal_length));
    return radian * (180/Math.PI)
}

function getAzimuth(base_angle, viewing_angle){
    //base_angle→向いている方向 viewing_angle→視野角
    view_minus = base_angle - viewing_angle/2;
    view_plus = base_angle + viewing_angle/2;
    if(view_minus<0){
      view_minus = view_minus +360;
    }
    if(view_plus>360){
      view_plus = view_plus - 360; 
    }
    view_minus = parseFloat(view_minus);
    view_plus = parseFloat(view_plus);
    return [view_minus, view_plus]
}

function setPosition(lat, lon){
  //現在の中心地を示すピンを削除
  centerpin.remove();
  //取得した緯度・経度をそれぞれinputのvalueに代入
  //document.getElementById('lat').value = lat;
  //document.getElementById('lon').value = lon;

  //新しい立ち位置にピンを刺す
  centerpin = L.marker([lat, lon]).addTo(mymap);

}

function inputtedFocalLength(){
  let fl = document.getElementById('focal_length').value;
  if(Number(fl)>0 && Number(fl)<6000){
    calc();
  }
}


function calc(){
    //入力値を取得
    var input_focal_length = parseFloat(document.getElementById('focal_length').value);    
    var input_direction = parseFloat(document.getElementById('direction').value);
    //現在指定位置の緯度・経度
    let pin_position = centerpin.getLatLng();
    var input_lat = parseFloat(pin_position['lat']);
    var input_lon = parseFloat(pin_position['lng']);
    //水平画角を取得
    var view_angle = getViewingAngle(input_focal_length);
    //画角の左端・右端の方位角を算出
    var azimuth = getAzimuth(input_direction, view_angle);
    //基準地点からazimuth[0], azimuth[1]方向に10km地点の緯度・経度
    //ラジアンに変換
    var input_lat_rad = getRad(input_lat);
    var input_lon_rad = getRad(input_lon);
    azimuth0 = getRad(azimuth[0]);
    azimuth1 = getRad(azimuth[1]);
    var position0 = vincenty(input_lat_rad, input_lon_rad, azimuth0, 10*1000);
    var position1 = vincenty(input_lat_rad, input_lon_rad, azimuth1, 10*1000);
    latlngs = [[input_lat, input_lon], [position0[0], position0[1]], [position1[0], position1[1]]];

    
    //ポリゴン・マーカー初期化
    polygon.remove();
    centerpin.remove();
    
    polygon = L.polygon(latlngs, {color: 'red'}).addTo(mymap);
    centerpin = L.marker([input_lat, input_lon]).addTo(mymap);
    //mymap.setView([input_lat, input_lon]);  
}

//Vincenty
const a = 6378137.06; //長軸半径（＝赤道半径）
const f = 1/298.257223563; //扁平率
const b = (1-f)*a; //短軸半径（極半径）
//度からラジアンへの変換
function getRad(x){
  return x/180*Math.PI;
}
//ラジアンから度への変換
function getArc(x){
  return x*180/ Math.PI;
}
//xのy乗を返す
function getPow(x, y){
  return Math.pow(x, y);
}


//vincenty順解法
//引数は緯度，経度，方位角，距離
function vincenty(lat, lng, az, length){
  let U1 = Math.atan((1-f)*Math.tan(lat));
  let sigma1 = Math.atan(Math.tan(U1) / Math.cos(az));
  let alpha = Math.asin(Math.cos(U1) * Math.sin(az));
  let u_sq = getPow(Math.cos(alpha), 2) * ((getPow(a, 2) - getPow(b,2)) / getPow(b,2));
  let A = 1 + (u_sq/16384) * (4096 + u_sq*(-768 + u_sq*(320-175*u_sq)));
  let B = (u_sq/1024) * (256 + u_sq*(-128 + u_sq*(74-47*u_sq)));
  let sigma = length/ b /A;
  //do{}の中で計算するが外でも使うのでここで宣言しとく
  let sigma_original;
  let sigma_m;
  do{
    sigma_original = sigma;
    
    sigma_m = 2*sigma1 + sigma; 
    let pro1 = Math.cos(sigma)*(-1+2*getPow(Math.cos(sigma_m),2)) - B/6 * Math.cos(sigma_m)*(-3+4*getPow(Math.sin(sigma_m),2))*(-3+4*getPow(Math.cos(sigma_m),2)); //後式計算のための仮計算
    let deltaSigma = B * Math.sin(sigma) * (Math.cos(sigma_m) + B/4*pro1);
    sigma = length / b / A + deltaSigma;
  } while(Math.abs(sigma_original - sigma)>1e-9);
  
  let pro2child = Math.sin(U1) * Math.cos(sigma) + Math.cos(U1) * Math.sin(sigma) * Math.cos(az); //分子
  let pro2mom = (1 - f) * getPow ( getPow( Math.sin(alpha),2) + getPow( Math.sin(U1) * Math.sin(sigma) - Math.cos(U1) * Math.cos(sigma) * Math.cos(az) ,2) , 1 / 2); //分母
  let phi = Math.atan(pro2child/pro2mom);
  let lamda = Math.atan(Math.sin(sigma)*Math.sin(az)/(Math.cos(U1)*Math.cos(sigma)-Math.sin(U1)*Math.sin(sigma)*Math.cos(az)));
  let C = f / 16 * getPow(Math.cos(alpha),2) * (4 + f *(4- 3*getPow(Math.cos(alpha),2)));
  let L = lamda - (1-C)*f*Math.sin(alpha)* (sigma + C*Math.sin(sigma)* (Math.cos(sigma_m)+ C*Math.cos(sigma)*(-1 + 2* Math.cos(sigma_m),2)));
  return [getArc(phi), getArc(lng+L)];
}