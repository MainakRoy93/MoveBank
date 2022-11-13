
export function getCoordinates(lat, lon, radius){

    let phi   = (90-lat)*(Math.PI/180)
    let theta = (lon+180)*(Math.PI/180)
    let  x = -((radius) * Math.sin(phi)*Math.cos(theta))
    let z = ((radius) * Math.sin(phi)*Math.sin(theta))
    let y = ((radius) * Math.cos(phi))
    return {'x':x,'y':y,'z':z}
}

export function getMidPoint(start,end){
    return {'x':(start.x + end.x)/2,'y':(start.y + end.y)/2,'z':(start.z + end.z)/2}
}

export function vector3toLonLat( vector )
{

        let radius = vector.length();
        var latRads = Math.acos(vector.y / radius);
        var lngRads = Math.atan2(vector.z, vector.x);
        var lat = (Math.PI / 2 - latRads) * (180 / Math.PI);
        var lng = (Math.PI - lngRads) * (180 / Math.PI);
        // console.log(lat, lng);
        return [lat, lng - 180];
}

export function getBezierMidPointCoordinates(startVector, lat,lon){
    let startCoordinates = vector3toLonLat(startVector)
    let midPointX = (startCoordinates[0] + lat)/2
    let midPointY = (startCoordinates[1] + lon)/2
    let midPointLatLong = getCoordinates(midPointX,midPointY, 8)
    return midPointLatLong
}

