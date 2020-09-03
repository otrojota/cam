class TimeUtils {
    static dateToObject(d) {
        return {y:d.getFullYear(), m:d.getMonth(), d:d.getDate()};
    }
    static datetimeToObject(d) {
        return {y:d.getFullYear(), m:d.getMonth(), d:d.getDate(), hh:d.getHours(), mm:d.getMinutes(), ss:d.getSeconds(), ms:d.getMilliseconds()};
    }
    static objectToDate(o) {
        return new Date(o.y, o.m, o.d, 0,0,0,0);
    }
    static objectToDatetime(o) {
        return new Date(o.y, o.m, o.d, o.hh, o.mm, o.ss, o.ms);
    }
    static formatDate(o, sep="/") {
        return (o.d < 10?"0":"") + o.d + sep + ((o.m + 1) < 10?"0":"") + (o.m + 1) + sep + o.y;
    }
    static formatTime(o) {
        return (o.hh < 10?"0":"") + o.hh + ":" + (o.mm  < 10?"0":"") + o.mm  + ":" + (o.ss < 10?"0":"") + o.ss;
    }

    static formatDateTime(o, sep="/") {
        return this.formatDate(o, sep) + " " + this.formatTime(o);        
    }
}