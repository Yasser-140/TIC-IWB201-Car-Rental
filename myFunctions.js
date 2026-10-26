var DISCOUNT_LIMIT_DAYS = 10;
var DISCOUNT_RATE = 0.05;
var MS_PER_DAY = 24 * 60 * 60 * 1000;
var DATE_FORMAT = "yyyy-mm-dd";
function trimText(value) {
    return value.replace(/^\s+|\s+$/g, "");
}
function formatMoney(number) {
    var text = String(Math.round(number));
    return text.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ل.س";
}
function validateName(value) {
    value = trimText(value);
    if (value === "") {
        return "";
    }
    var pattern = /^[\u0621-\u064A]+(\s+[\u0621-\u064A]+)*$/;
    if (!pattern.test(value)) {
        return "الاسم يجب أن يحتوي أحرفاً عربية فقط (بدون أرقام أو رموز أو أحرف لاتينية).";
    }
    return "";
}
function validateNationalId(value) {
    value = trimText(value);
    if (value === "") {
        return "الرقم الوطني إلزامي.";
    }
    if (!/^\d+$/.test(value)) {
        return "الرقم الوطني يجب أن يتكون من أرقام فقط.";
    }
    if (value.length !== 11) {
        return "الرقم الوطني يجب أن يتكون من 11 خانة (أدخلت " + value.length + ").";
    }
    var province = parseInt(value.substring(0, 2), 10);
    if (province < 1 || province > 14) {
        return "أول خانتين من الرقم الوطني تمثلان المحافظة ويجب أن تكونا بين 01 و 14.";
    }
    return "";
}
function parseDate(value) {
    var year, month, day, match;
    if (DATE_FORMAT === "yyyy-mm-dd") {
        match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (match === null) { return null; }
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        day = parseInt(match[3], 10);
    } else {
        match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
        if (match === null) { return null; }
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
    }
    var time = Date.UTC(year, month - 1, day);
    var check = new Date(time);
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
        return null;
    }
    return time;
}
function validateDate(value, label) {
    value = trimText(value);
    if (value === "") {
        return label + " إلزامي.";
    }
    if (parseDate(value) === null) {
        return label + " غير صحيح، الصيغة المطلوبة " + DATE_FORMAT + " وتاريخ موجود فعلاً.";
    }
    return "";
}
function validateDateOrder(startValue, endValue) {
    var start = parseDate(trimText(startValue));
    var end = parseDate(trimText(endValue));
    if (start !== null && end !== null && end <= start) {
        return "تاريخ النهاية يجب أن يكون لاحقاً لتاريخ البداية.";
    }
    return "";
}
function validateMobile(value) {
    value = trimText(value);
    if (value === "") {
        return "";
    }
    var pattern = /^(?:0|\+963|00963)(93|94|95|96|98|99)\d{7}$/;
    if (!pattern.test(value)) {
        return "رقم الموبايل غير صحيح. يجب أن يبدأ بـ 093 أو 098 أو 099 (Syriatel) أو 094 أو 095 أو 096 (MTN) ويتألف من 10 أرقام.";
    }
    return "";
}
function validateEmail(value) {
    value = trimText(value);
    if (value === "") {
        return "";
    }
    var pattern = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;
    if (!pattern.test(value)) {
        return "البريد الإلكتروني غير صحيح، مثال: name@example.com";
    }
    return "";
}
function countDays(startValue, endValue) {
    var start = parseDate(trimText(startValue));
    var end = parseDate(trimText(endValue));
    return Math.round((end - start) / MS_PER_DAY);
}
function getSelectedCars() {
    var cars = [];
    $("input.select-car:checked").each(function () {
        var row = $(this).closest("tr");
        cars.push({
            code: $(this).val(),
            model: row.find("td.model").text(),
            price: parseInt(row.find("td.price span").text(), 10)
        });
    });
    return cars;
}
function calculateBill(cars, days) {
    var lines = [];
    var total = 0;
    for (var i = 0; i < cars.length; i++) {
        var subtotal = cars[i].price * days;
        total += subtotal;
        lines.push({ model: cars[i].model, price: cars[i].price, days: days, subtotal: subtotal });
    }
    var discount = 0;
    if (days > DISCOUNT_LIMIT_DAYS) {
        discount = total * DISCOUNT_RATE;
    }
    return { lines: lines, total: total, discount: discount, finalAmount: total - discount };
}
function showResult(name, cars, days) {
    var bill = calculateBill(cars, days);
    var body = $("#resultBody").empty();
    if (trimText(name) !== "") {
        body.append($("<p></p>").text("مقدم الطلب: " + trimText(name)));
    }
    var table = $("<table></table>");
    table.append("<thead><tr><th>السيارة</th><th>السعر اليومي</th><th>عدد الأيام</th><th>المجموع</th></tr></thead>");
    var tbody = $("<tbody></tbody>");
    for (var i = 0; i < bill.lines.length; i++) {
        var l = bill.lines[i];
        var tr = $("<tr></tr>");
        tr.append($("<td></td>").text(l.model));
        tr.append($("<td></td>").text(formatMoney(l.price)));
        tr.append($("<td></td>").text(l.days));
        tr.append($("<td></td>").text(formatMoney(l.subtotal)));
        tbody.append(tr);
    }
    table.append(tbody);
    body.append(table);
    var summary = $("<div></div>");
    summary.append($("<div class='sum-line'></div>").append("<span>عدد أيام التأجير</span>").append($("<span></span>").text(days)));
    summary.append($("<div class='sum-line'></div>").append("<span>المجموع قبل الخصم</span>").append($("<span></span>").text(formatMoney(bill.total))));
    var discountLabel = days > DISCOUNT_LIMIT_DAYS ? "الخصم 5% (المدة أكثر من 10 أيام)" : "الخصم (لا ينطبق، المدة 10 أيام أو أقل)";
    summary.append($("<div class='sum-line discount'></div>").append($("<span></span>").text(discountLabel)).append($("<span></span>").text("- " + formatMoney(bill.discount))));
    summary.append($("<div class='sum-line final'></div>").append("<span>المبلغ النهائي</span>").append($("<span></span>").text(formatMoney(bill.finalAmount))));
    body.append(summary);
    $("#resultOverlay").fadeIn(250);
}
function setError(fieldId, message) {
    $("#err-" + fieldId).text(message);
    if (message !== "") {
        $("#" + fieldId).addClass("invalid");
    } else {
        $("#" + fieldId).removeClass("invalid");
    }
}
function validateForm() {
    var startValue = $("#startDate").val();
    var endValue = $("#endDate").val();
    var errors = {
        fullName: validateName($("#fullName").val()),
        nationalId: validateNationalId($("#nationalId").val()),
        startDate: validateDate(startValue, "تاريخ بداية التأجير"),
        endDate: validateDate(endValue, "تاريخ نهاية التأجير"),
        mobile: validateMobile($("#mobile").val()),
        email: validateEmail($("#email").val())
    };
    if (errors.startDate === "" && errors.endDate === "") {
        errors.endDate = validateDateOrder(startValue, endValue);
    }
    var allValid = true;
    for (var field in errors) {
        setError(field, errors[field]);
        if (errors[field] !== "") {
            allValid = false;
        }
    }
    return allValid;
}
function refreshSelectedList() {
    var cars = getSelectedCars();
    var names = [];
    for (var i = 0; i < cars.length; i++) {
        names.push(cars[i].model + " (" + cars[i].code + ")");
    }
    $("#selectedList").text(names.join("، "));
}
$(document).ready(function () {
    $("#content").hide().fadeIn(500);
    var currentPage = window.location.pathname.split("/").pop().toLowerCase();
    if (currentPage === "") {
        currentPage = "home.html";
    }
    $("#nav a").each(function () {
        if ($(this).attr("href").toLowerCase() === currentPage && this.id !== "exitLink") {
            $(this).addClass("active");
        }
    });
    $("#exitLink").click(function (event) {
        event.preventDefault();
        if (window.confirm("هل تريد الخروج من الموقع؟")) {
            $("#content").fadeOut(300, function () {
                $(this).html("<div class='card'><h2>شكراً لزيارتكم</h2><p><a href='home.html'>العودة إلى الصفحة الرئيسية</a></p></div>").fadeIn(300);
            });
        }
    });
    if ($("#carsTable").length === 0) {
        return;
    }
    $("input.show-details").click(function () {
        var detailsRow = $(this).closest("tr").next("tr.details-row");
        if (this.checked) {
            detailsRow.fadeIn(300);
        } else {
            detailsRow.fadeOut(200);
        }
    });
    $("input.select-car").click(function () {
        $(this).closest("tr").toggleClass("selected-row", this.checked);
        if (getSelectedCars().length === 0) {
            $("#bookingSection").slideUp(250);
        } else {
            refreshSelectedList();
        }
    });
    $("#btnContinue").click(function () {
        var cars = getSelectedCars();
        if (cars.length === 0) {
            $("#carsMsg").text("الرجاء اختيار سيارة واحدة على الأقل قبل المتابعة.").fadeIn(200);
            return;
        }
        $("#carsMsg").hide();
        refreshSelectedList();
        $("#bookingSection").slideDown(400, function () {
            $("html, body").animate({ scrollTop: $("#bookingSection").offset().top - 20 }, 400);
        });
    });
    $("#bookingForm").submit(function (event) {
        event.preventDefault();
        var cars = getSelectedCars();
        if (cars.length === 0) {
            $("#carsMsg").text("لا توجد سيارة مختارة. اختر سيارة أولاً.").fadeIn(200);
            return;
        }
        if (!validateForm()) {
            $(".invalid").first().focus();
            return;
        }
        var days = countDays($("#startDate").val(), $("#endDate").val());
        showResult($("#fullName").val(), cars, days);
    });
    $("#bookingForm").on("reset", function () {
        $(".error").text("");
        $("input.invalid").removeClass("invalid");
    });
    $("#btnClose").click(function () {
        $("#resultOverlay").fadeOut(200);
    });
    $("#resultOverlay").click(function (event) {
        if (event.target === this) {
            $(this).fadeOut(200);
        }
    });
});
