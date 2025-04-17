

const apiKey = '9f019e41c8724efa81209eaea290154a';//مفتاح الـ API
//اضافة event عند النقر على enter 
  document.getElementById('cityInput').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    searchPlaces();  
  }
});
// عند النقر المزدوج على الحقل النصي، يتم مسح قيمته
  document.querySelector('input').addEventListener('dblclick', () => {
  document.querySelector('input').value = ''; 
});
// عند تحريك الماوس فوق الحقل النصي، يتم إضافة التركيز عليه
    document.querySelector('input').addEventListener('mouseover', () => {
    document.querySelector('input').focus();
});

  //البحث باستخدام اسم المدينة
  async function searchPlaces() {
  const cityInput = document.getElementById('cityInput');// للتعديل على الشكل 
  const city = cityInput.value;
  const resultContainer = document.getElementById('resultContainer');
  const loadingMessage = document.getElementById('loading');

  resultContainer.innerHTML = ''; // مسح النتائج القديمة
  loadingMessage.style.display = 'block'; 

  if (!city) {// للتحقق هل فيه قيمة أو لا 
    showBackgroundAndResetTitleColor(); 
    cityInput.classList.add('error');
    cityInput.focus();
    alert("الرجاء إدخال اسم المدينة");
    loadingMessage.style.display = 'none';
    return;
  } else {
    cityInput.classList.remove('error');
  }

  try {
    //لاحضار احداثيات المدينة من geoapify
  const responseGeo = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${city}&apiKey=${apiKey}`);
  const cityData = await responseGeo.json();// تحويل البيانات

  if (!cityData.features.length) {
    showBackgroundAndResetTitleColor(); 
    alert("عذرًا، لم نتمكن من العثور على المدينة.");
    loadingMessage.style.display = 'none'; // إخفاء رسالة التحميل
  return;
  }
  // استخراج احداثيات  خط الطول والعرض  
  const lat = cityData.features[0].geometry.coordinates[1];
  const lon = cityData.features[0].geometry.coordinates[0];

  const categories = [
  { key: 'catering.restaurant', title: '🍽️ المطاعم', class: 'restaurant'},
  { key: 'entertainment', title: '🎉 الترفيه' , class: 'entertainment' },
  { key: 'building.commercial', title: '🏢 المباني التجارية', class: 'building' },
  ];

  let hasResults = false; // لتتبع إذا كانت هناك أماكن  في الفئات 

  for (const category of categories) {
    const apiUrl = `https://api.geoapify.com/v2/places?categories=${category.key}&filter=circle:${lon},${lat},7000&limit=5&apiKey=${apiKey}`;//5 فقط يتم عرضها 
    const resp = await fetch(apiUrl);
    const data = await resp.json();
    const places = data.features;
    // التحقق من وجود أماكن
    if (places.length > 0) {
      const title = document.createElement('h3');
      title.className = 'category-title';
      title.textContent = category.title;
      resultContainer.appendChild(title);//إضافة عنوان 

    places.forEach(place => {//عرض المعلومات
      const name = place.properties.name || 'لا يوجد اسم';
      const address = place.properties.formatted || 'لا يوجد عنوان';
      const category = place.properties.categories[1] || 'فئة غير متوفرة';
      const openingHours = place.properties.opening_hours || 'أوقات العمل غير متوفرة';
      const cuisine = (place.properties.catering && place.properties.catering.cuisine) || 'نوع المأكولات غير محدد';
      
      const card = document.createElement('div');//إنشاء بطاقة 
      const categoryClass = category.toLowerCase().replace(/\s+/g, '-');  // لتحويل الفئة إلى lowercase وتغيير الفراغات إلى شرطات
      const cuisineList = cuisine.split(';');
      const formattedCuisine = cuisineList.map(item => `<li>${item}</li>`).join('');// تحويل كل نوع من المأكولات إلى عنصر <li> باستخدام .map() ثم يتم دمجها
      const type = category === 'building.commercial' ? `<strong>النوع:</strong> ${place.properties.type || ' غير متوفر'}<br>` : '';//إضافة نوع المكان
      card.className = `card ${categoryClass}`
      //إنشاء محتوى البطاقة
      card.innerHTML = `
        <div class="card-content">
          <strong>الاسم:</strong> ${name} <br>
          <strong>العنوان:</strong> ${address} <br>
          <strong>الفئة:</strong> ${category} <br>
          ${category === 'catering.restaurant' ? `
          <strong>أوقات العمل:</strong> ${openingHours}<br>
          <strong>نوع المأكولات:</strong> <ul>${formattedCuisine}</ul>` : ''}
          ${category.key === 'building.commercial' ? `<strong>أوقات العمل:</strong> ${openingHours}<br>` : ''}
          ${type}
          <a href="https://www.google.com/maps/search/?api=1&query=${place.geometry.coordinates[1]},${place.geometry.coordinates[0]}" target="_blank">عرض على الخريطة</a>
        </div>
          `;
          hideBackgroundAndChangeTitleColor();
      resultContainer.appendChild(card);//إضافة البطاقة 
    });

    hasResults = true; // تم العثور على أماكن في هذه الفئة
    }
  }
  //عدم العثور على أي أماكن في الفئات 
  if (!hasResults) {
    showBackgroundAndResetTitleColor(); 
    const noResultsMessage = document.createElement('p');
    noResultsMessage.style.color= '#f0f2f2';
    noResultsMessage.textContent = "عذرًا، لم نتمكن من العثور على أي أماكن في هذه الفئات";
    resultContainer.appendChild(noResultsMessage);
  }

  } catch (error) {
    console.error(error);
    alert("حدث مشكلة أثناء تحميل البيانات. الرجاء المحاولة مرة اخرى.");//إظهار تنبيه 
  } finally {
    loadingMessage.style.display = 'none'; // إخفاء رسالة التحميل بعد الانتهاء من البحث
  }
} 
  // دالة لإخفاء الصورة الخلفية وتغيير لون العنوان
  function hideBackgroundAndChangeTitleColor() {
    const background = document.querySelector('.background');
    const title1 = document.querySelector('#title');
    // إخفاء الصورة تمامًا
    background.style.display = 'none';
    title1.style.color = '#005f73';  
  }
  
  // دالة لإظهار الصورة الخلفية وإرجاع لون العنوان إلى الأبيض
  function showBackgroundAndResetTitleColor() {
    const background = document.querySelector('.background');
    const title1 = document.querySelector('#title');
    // إظهار الصورة الخلفية
    background.style.display = 'block';
    // إعادة لون العنوان إلى اللون الأبيض
    title1.style.color = 'white';  
  }