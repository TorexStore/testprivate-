// ============================================================
// 1. إعدادات الربط (رابط Google Apps Script الخاص بك)
// ============================================================
const DATA_URL = "https://script.google.com/macros/s/AKfycbw7cYO6x_UmDDeD3PxrJ1hz0JUB3hzviboD2SF8WQYvcahAP87fagjkZDXlgZHNsjTm/exec";

// ============================================================
// 2. تشغيل الموقع عند التحميل
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    // جلب البيانات وتشغيل الموقع
    fetchWebsiteData();
    
    initSlider();
    initScrollTop();
});

// ============================================================
// 3. جلب البيانات وتوزيعها (مع إخفاء شاشة التحميل)
// ============================================================
function fetchWebsiteData() {
    console.log("جاري الاتصال بـ Google Sheets...");
    
    fetch(DATA_URL)
    .then(response => response.json())
    .then(data => {
        console.log("تم استلام البيانات:", data);
        
        // توزيع البيانات على أقسام الموقع
        if(data.home) updateHome(data.home);
        if(data.about) updateAbout(data.about);
        if(data.contact) updateContact(data.contact);
        if(data.cars) renderFleet(data.cars);
        if(data.reviews) renderReviews(data.reviews);
        
        filterCars(); // تحديث الفلتر

        // =================================================
        // إخفاء شاشة التحميل بعد الانتهاء (الكود الجديد)
        // =================================================
        const loader = document.getElementById('loading-screen');
        if(loader) {
            // جعل الشفافية 0 (تأثير تلاشي)
            loader.style.opacity = '0';
            // إزالة العنصر تماماً بعد نصف ثانية
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    })
    .catch(error => {
        console.error("خطأ في الاتصال:", error);
        // إخفاء الشاشة حتى لو حدث خطأ، لكي يرى المستخدم الموقع
        const loader = document.getElementById('loading-screen');
        if(loader) loader.style.display = 'none';
    });
}

// --- 1. تحديث الصفحة الرئيسية ---
function updateHome(data) {
    if(data.logo_url) document.getElementById('img-logo').src = data.logo_url;
    setText('txt-hero-title', data.hero_title);
    setText('txt-hero-subtitle', data.hero_subtitle);

    const slides = document.querySelectorAll('.slide');
    if (data.slide1 && slides[0]) slides[0].style.backgroundImage = `url('${data.slide1}')`;
    if (data.slide2 && slides[1]) slides[1].style.backgroundImage = `url('${data.slide2}')`;
    if (data.slide3 && slides[2]) slides[2].style.backgroundImage = `url('${data.slide3}')`;
}

// --- 2. تحديث قسم من نحن ---
function updateAbout(data) {
    if(data.about_image) document.getElementById('img-about').src = data.about_image;
    setText('txt-about-desc', data.about_desc);
    
    setText('txt-feat1-title', data.feat1_title);
    setText('txt-feat1-desc', data.feat1_desc);
    setText('txt-feat2-title', data.feat2_title);
    setText('txt-feat2-desc', data.feat2_desc);
    setText('txt-feat3-title', data.feat3_title);
    setText('txt-feat3-desc', data.feat3_desc);
}

// --- 3. تحديث التواصل والروابط ---
function updateContact(data) {
    setText('txt-contact-phone', data.phone);
    setText('txt-contact-email', data.email);
    setText('txt-contact-address', data.address);
    setText('txt-footer-phone', data.phone);
    setText('txt-footer-address', data.address);
    
    if(data.map_url) document.getElementById('map-iframe').src = data.map_url;

    updateHref('.social-btn.facebook', data.facebook);
    updateHref('.social-btn.instagram', data.instagram);
    updateHref('.social-btn.tiktok', data.tiktok);
    updateHref('.social-btn.whatsapp, .whatsapp-float, .btn-primary', data.whatsapp_link);
}

// --- 4. عرض السيارات (Fleet) ---
function renderFleet(cars) {
    const groups = {
        luxury: document.querySelector('#group-luxury .cars-grid'),
        sport: document.querySelector('#group-sport .cars-grid'),
        family: document.querySelector('#group-family .cars-grid'),
        electric: document.querySelector('#group-electric .cars-grid'),
        economy: document.querySelector('#group-economy .cars-grid')
    };
    
    // مسح السيارات القديمة
    for (let k in groups) if(groups[k]) groups[k].innerHTML = '';

    // إضافة السيارات الجديدة
    cars.forEach(car => {
        const container = groups[car.type];
        if (container) {
            container.innerHTML += `
                <div class="car-card" data-type="${car.type}" data-passengers="${car.passengers}">
                    <div class="car-image">
                        <span class="car-tag tag-${car.type}">${car.categoryName}</span>
                        <img src="${car.image}" alt="${car.name}">
                    </div>
                    <div class="car-info">
                        <div class="car-name">${car.name}</div>
                        <div class="car-specs">
                            <div class="spec"><i class="fas fa-users"></i> ${car.passengers}</div>
                            <div class="spec"><i class="fas fa-suitcase"></i> ${car.bags}</div>
                        </div>
                        <a href="#" class="btn-book whatsapp-link">احجز الآن</a>
                    </div>
                </div>`;
        }
    });

    // تحديث رابط الحجز للسيارات الجديدة
    fetch(DATA_URL).then(r=>r.json()).then(d=>{
         if(d.contact && d.contact.whatsapp_link) {
             document.querySelectorAll('.btn-book').forEach(b=>b.href=d.contact.whatsapp_link);
         }
    });
}

// --- 5. عرض التقييمات (Reviews) ---
function renderReviews(reviews) {
    const container = document.getElementById('reviewsContainer');
    if (!reviews || !container) return;
    
    if(reviews.length > 0) container.innerHTML = '';
    
    // عرض آخر 4 تقييمات
    reviews.slice(-4).reverse().forEach(r => {
        let stars = '';
        for(let i=1; i<=5; i++) stars += i<=r.rating ? '<i class="fas fa-star active"></i>' : '<i class="far fa-star"></i>';
        
        container.innerHTML += `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar"><i class="fas fa-user"></i></div>
                        <div>
                            <h4 class="reviewer-name">${r.name}</h4>
                            <span class="review-date">${new Date(r.date).toLocaleDateString('ar-SA')}</span>
                        </div>
                    </div>
                    <div class="review-stars-display">${stars}</div>
                </div>
                <p class="review-text">${r.comment}</p>
            </div>`;
    });
}

// ============================================================
// 4. الوظائف التفاعلية
// ============================================================

// إرسال التقييم
function addReview(e) {
    e.preventDefault();
    const btn = document.querySelector('.btn-submit');
    const orgTxt = btn.innerHTML;
    
    btn.innerHTML = 'جاري الإرسال... <i class="fas fa-spinner fa-spin"></i>'; 
    btn.disabled = true;
    
    fetch(DATA_URL, {
        method: 'POST', 
        mode: 'no-cors',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            name: document.getElementById('reviewName').value,
            rating: document.getElementById('ratingValue').value,
            comment: document.getElementById('reviewComment').value
        })
    }).then(()=>{
        alert('شكراً لك! تم إرسال تقييمك.');
        document.getElementById('reviewForm').reset(); 
        setRating(0);
        btn.innerHTML = orgTxt; 
        btn.disabled = false;
        fetchWebsiteData(); // تحديث الصفحة لرؤية التقييم الجديد
    }).catch((err)=>{ 
        console.error(err);
        alert('حدث خطأ، حاول مرة أخرى.'); 
        btn.innerHTML = orgTxt; 
        btn.disabled = false; 
    });
}

// الفلتر
function filterCars() {
    const t = document.getElementById('typeFilter').value;
    const p = document.getElementById('passengersFilter').value;
    
    document.querySelectorAll('.fleet-category-group').forEach(g => {
        const gCat = g.getAttribute('data-category');
        if(t === 'all' || gCat === t) {
            let count = 0;
            g.querySelectorAll('.car-card').forEach(card => {
                const cP = card.getAttribute('data-passengers');
                if(p === 'all' || cP == p) { card.style.display='block'; count++; }
                else { card.style.display='none'; }
            });
            g.style.display = count > 0 ? 'block' : 'none';
        } else {
            g.style.display = 'none';
        }
    });
}

// دوال مساعدة
function setRating(r) {
    document.getElementById('ratingValue').value = r;
    document.querySelectorAll('.star-input').forEach(s => {
        s.classList.toggle('active', s.dataset.value <= r);
    });
}

function setText(id, txt) { 
    const el = document.getElementById(id); 
    if(el && txt) el.innerText = txt; 
}

function updateHref(selector, link) { 
    if(!link) return;
    document.querySelectorAll(selector).forEach(el => el.href = link); 
}

// السلايدر
let slideIndex = 1; 
let sliderInterval;
function initSlider() { 
    if(document.querySelectorAll(".slide").length){
        showSlides(1); 
        sliderInterval=setInterval(()=>showSlides(slideIndex+=1),5000);
    } 
}
function showSlides(n) {
    const s = document.querySelectorAll(".slide"); 
    const d = document.querySelectorAll(".dot");
    if(!s.length) return;
    if(n > s.length) slideIndex=1; 
    if(n < 1) slideIndex=s.length;
    s.forEach(e=>e.classList.remove("active")); 
    d.forEach(e=>e.classList.remove("active"));
    s[slideIndex-1].classList.add("active"); 
    if(d[slideIndex-1]) d[slideIndex-1].classList.add("active");
}
function currentSlide(n) { 
    showSlides(slideIndex=n); 
    clearInterval(sliderInterval); 
    sliderInterval=setInterval(()=>showSlides(slideIndex+=1),5000); 
}
function initScrollTop() {
    const b = document.getElementById("scrollTopBtn");
    if(b) { 
        window.onscroll = () => {
            b.style.display = (document.body.scrollTop>200||document.documentElement.scrollTop>200) ? "block" : "none";
        };
        b.onclick = () => { document.body.scrollTop=0; document.documentElement.scrollTop=0; };
    } 
}
