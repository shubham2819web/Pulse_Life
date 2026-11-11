/* Pulse & Life website interactions. Google Sheets requests use the same-origin Next.js API. */

const footerMarkup = `
<footer class="footer"><div class="container"><div class="footer-grid">
  <div class="footer-about"><a class="brand" href="/"><span class="brand-mark">P<span>+</span></span><span class="brand-name">PULSE <b>& LIFE</b><small>MEDICINE TRADING L.L.C.</small></span></a><p data-i18n="footerAbout">A Dubai-based trading company for para pharmaceutical products, medical and surgical articles, and paper products.</p></div>
  <div><h4 data-i18n="quickLinks">Quick links</h4><div class="footer-links"><a href="/" data-i18n="navHome">Home</a><a href="/about" data-i18n="navAbout">About Us</a><a href="/products" data-i18n="navProducts">Products & Services</a><a href="/why-us" data-i18n="navWhy">Why Choose Us</a><a href="/contact" data-i18n="navContact">Contact Us</a></div></div>
  <div class="footer-contact"><h4 data-i18n="contactDetails">Contact details</h4><p>Dubai, United Arab Emirates</p><p><a href="tel:+971553017379">+971 55 301 7379</a></p><p><a href="mailto:plmedicinedxb@gmail.com">plmedicinedxb@gmail.com</a></p></div>
  <div class="newsletter"><h4 data-i18n="newsletterTitle">Stay connected</h4><p data-i18n="newsletterText">Subscribe to receive company updates and announcements.</p><form class="newsletter-form" id="newsletterForm"><input type="text" name="name" placeholder="Name (optional)" aria-label="Name (optional)"><input type="email" name="email" required placeholder="Your email address" aria-label="Your email address"><input type="tel" name="phone" placeholder="Phone (optional)" aria-label="Phone (optional)"><button type="submit" aria-label="Subscribe">→</button></form><div class="footer-status" id="newsletterStatus" role="status"></div></div>
</div><div class="footer-bottom"><span>© <span id="year"></span> Pulse & Life Medicine Trading L.L.C.</span><span data-i18n="footerNote">Licensed trading activities • Dubai, UAE</span></div></div></footer>
<button class="chat-launch" id="chatLaunch" aria-label="Open chat">✉</button>
<section class="chat-panel" id="chatPanel" aria-label="Website chat" aria-hidden="true">
  <div class="chat-head"><div><b data-i18n="chatTitle">Chat with our team</b><small data-i18n="chatSub">Leave us a message and we'll get back to you.</small></div><div class="chat-head-actions"><button type="button" class="chat-hide-widget" id="chatHideWidget" aria-label="Hide chat widget">Hide</button><button type="button" class="chat-close" id="chatClose" aria-label="Close chat">×</button></div></div>
  <div class="chat-profile">
    <div class="chat-profile-group"><span>Share details (optional)</span><div class="chat-profile-actions">
      <button type="button" data-profile="name" aria-pressed="false">+ Name</button>
      <button type="button" data-profile="email" aria-pressed="false">+ Email</button>
      <button type="button" data-profile="phone" aria-pressed="false">+ Phone</button>
    </div></div>
    <div class="chat-profile-group chat-enquiry-group"><span>What is your enquiry about? (optional)</span><div class="chat-profile-actions chat-enquiry-actions">
      <button type="button" data-enquiry="Product availability" aria-pressed="false">Products</button>
      <button type="button" data-enquiry="Pricing" aria-pressed="false">Pricing</button>
      <button type="button" data-enquiry="Business partnership" aria-pressed="false">Partnership</button>
      <button type="button" data-enquiry="General enquiry" aria-pressed="false">General</button>
      <button type="button" data-enquiry="Other" aria-pressed="false">Other</button>
    </div></div>
  </div>
  <div class="chat-messages" id="chatMessages" aria-live="polite" aria-relevant="additions"></div>
  <form class="chat-form" id="chatForm"><input name="message" required placeholder="Type your message..." aria-label="Type your message"><button type="submit" aria-label="Send message">➤</button></form>
  <div class="chat-footnote" id="chatStatus" aria-live="polite">You can message us without sharing your details.</div>
</section><button type="button" class="chat-restore" id="chatRestore" hidden>Show chat</button>`;
if (document.body.dataset.chatWidget !== "disabled") {
  document.getElementById("site-footer")?.insertAdjacentHTML("beforeend", footerMarkup);
} else {
  const footerOnly = footerMarkup.slice(0, footerMarkup.indexOf('<button class="chat-launch"'));
  document.getElementById("site-footer")?.insertAdjacentHTML("beforeend", footerOnly);
}

const translations = {
en: {
topline:"Trusted medical & healthcare product trading in Dubai",navHome:"Home",navAbout:"About Us",navProducts:"Products & Services",navWhy:"Why Choose Us",navContact:"Contact Us",
heroEyebrow:"YOUR TRUSTED TRADING PARTNER IN DUBAI",heroTitle:'Supporting better care through <em>trusted supply.</em>',heroText:"Connecting businesses with para pharmaceutical products, medical and surgical articles, and essential paper products through a professional trading approach.",exploreProducts:"Explore Products",talkToUs:"Talk to our team",heroProof:"Dubai-based trading company • Business-focused service",visualTitle:"Healthcare essentials",visualSub:"Sourced with care. Supplied with confidence.",licensedCategories:"Licensed trading categories",businessReady:"Business-ready",professionalService:"Professional service approach",heroBottom:"MEDICAL • SURGICAL • PARA PHARMACEUTICAL • PAPER",
whoWeAre:"WHO WE ARE",introTitle:"A dependable partner for essential product trading.",introText:"Pulse & Life Medicine Trading L.L.C. is a Dubai-based trading company focused on supplying a range of para pharmaceutical products, medical and surgical articles, requisites, and paper products. We aim to build dependable business relationships through clear communication and a customer-focused approach.",discoverCompany:"Discover our company",basedInDubai:"Based in Dubai, United Arab Emirates",ourFocus:"OUR BUSINESS ACTIVITIES",categoryTitle:"What we trade",viewAll:"View all services →",cat1:"Para Pharmaceutical Products Trading",cat2:"Medical, Surgical Articles & Requisites Trading",cat3:"Paper Products Trading",cat1Desc:"A range of para pharmaceutical products for business and healthcare supply needs.",cat2Desc:"Medical and surgical articles and requisites for professional requirements.",cat3Desc:"Paper products to support day-to-day business and operational needs.",
whyPartner:"WHY PARTNER WITH US",whyTitle:"Business built on trust and consistency.",whyText:"We focus on responsive communication, dependable sourcing and a professional approach to every business interaction.",learnWhy:"Why choose us",quality:"Quality commitment",qualityDesc:"A careful approach to product requirements and supplier coordination.",sourcing:"Reliable sourcing",sourcingDesc:"Focused on suitable sourcing and clear business communication.",satisfaction:"Customer satisfaction",satisfactionDesc:"Building long-term relationships through attentive service.",approach:"Professional business approach",approachDesc:"A responsible, transparent and business-minded way of working.",letsConnect:"LET'S CONNECT",ctaTitle:"Looking for a dependable trading partner?",ctaText:"Tell us about your product or business requirements. Our team would be pleased to hear from you.",sendInquiry:"Send an inquiry",
aboutEyebrow:"GET TO KNOW US",aboutHero:"A focused, professional trading partner.",aboutLead:"Building dependable business relationships across essential healthcare and paper product categories.",photoTag:"Our business base",companyProfile:"COMPANY PROFILE",profileTitle:"Focused on trading. Committed to service.",profileText:"Pulse & Life Medicine Trading L.L.C. is a limited liability company based in Dubai, United Arab Emirates. Our licensed activities cover para pharmaceutical products trading, medical and surgical articles and requisites trading, and paper products trading.",profileText2:"We work to understand business requirements, coordinate suitable product sourcing and support customers with clear, professional communication.",factCategories:"Licensed activity categories",factLocation:"Dubai-based business",ourDirection:"OUR DIRECTION",directionTitle:"What guides our business",vision:"Our Vision",visionText:"To build lasting business relationships by being a dependable trading partner for essential product requirements.",mission:"Our Mission",missionText:"To serve customers through responsive communication, responsible sourcing coordination and professional trading services.",commitment:"Our Commitment",commitmentText:"To approach every inquiry with care, clarity and attention to the customer's stated requirements.",ourValues:"OUR VALUES",valuesTitle:"Principles behind every relationship.",valueIntegrity:"Integrity",valueReliability:"Reliability",valueService:"Service",valueTransparency:"Transparency",valueResponsibility:"Responsibility",
productEyebrow:"OUR LICENSED ACTIVITIES",productHero:"Product categories built around your needs.",productLead:"Explore the trading categories covered by our Dubai business licence.",paraText:"Trading in para pharmaceutical product categories to support customer and business supply requirements. Product availability and specifications can be discussed with our team.",medicalText:"Trading in medical and surgical articles and requisites for professional, institutional and business requirements. Contact us to discuss the products you are looking for.",paperText:"Trading in paper products for everyday business and operational needs. Share your specifications and quantity requirements with our team.",askAvailability:"Ask about availability",discussNeeds:"Discuss your requirements",requestInfo:"Request more information",licenseNote:"Our business activities are trading activities as listed on our Dubai trade licence. Product availability, specifications and applicable requirements should be confirmed directly with our team.",
whyEyebrow:"THE PULSE & LIFE APPROACH",whyHero:"A professional approach at every step.",whyLead:"We believe strong business relationships are built through consistency, communication and care.",ourPrinciples:"OUR PRINCIPLES",principlesTitle:"What you can expect from us",qualityLong:"We pay attention to product requirements and aim to coordinate sourcing in line with the specifications shared by customers.",sourcingLong:"We focus on understanding requirements and coordinating suitable sourcing through a considered business process.",satisfactionLong:"We value long-term relationships and aim to provide attentive communication throughout each inquiry.",approachLong:"We aim to be clear, responsive and professional in our dealings with customers and business partners.",ourPromise:"OUR PROMISE",promiseTitle:"Clear conversations. Considered solutions. Dependable relationships.",promiseText:"Every business has different needs. We take time to understand the request, communicate clearly and work towards a suitable way forward within our licensed trading activities.",startConversation:"Start a conversation",
contactEyebrow:"WE'RE HERE TO HELP",contactHero:"Let's discuss your requirements.",contactLead:"Send us an inquiry and our team will get back to you.",contactDetails:"CONTACT DETAILS",contactTitle:"Get in touch with our team.",contactText:"For product availability, business inquiries or general questions, please use the details below or send us a message.",office:"Dubai Office",addressPending:"Dubai, United Arab Emirates\nExact office address to be confirmed",phone:"Phone",email:"Email",businessHours:"Business enquiries",businessHoursText:"Contact us by phone or email for assistance.",sendMessage:"Send us a message",formIntro:"Please complete the form and we'll receive your inquiry.",fullName:"Full name *",emailAddress:"Email address *",phoneNumber:"Phone number",subject:"Subject",yourMessage:"Your message *",submitInquiry:"Submit inquiry",privacyNote:"Your information will be used to respond to your inquiry.",findUs:"FIND US",mapTitle:"Our Dubai location",mapPending:"The exact office location will be added once confirmed.",mapPlaceholder:"Google Maps location to be configured",
footerAbout:"A Dubai-based trading company for para pharmaceutical products, medical and surgical articles, and paper products.",quickLinks:"Quick links",newsletterTitle:"Stay connected",newsletterText:"Subscribe to receive company updates and announcements.",footerNote:"Licensed trading activities • Dubai, UAE",chatTitle:"Chat with our team",chatSub:"Leave us a message and we'll get back to you.",chatWelcome:"Hello! How can we help you today?"
},
ar: {
topline:"شريككم الموثوق لتجارة المنتجات الطبية والرعاية الصحية في دبي",navHome:"الرئيسية",navAbout:"من نحن",navProducts:"المنتجات والخدمات",navWhy:"لماذا تختارنا",navContact:"اتصل بنا",
heroEyebrow:"شريككم التجاري الموثوق في دبي",heroTitle:'ندعم رعاية أفضل من خلال <em>توريد موثوق.</em>',heroText:"نربط الشركات بمنتجات شبه صيدلانية والمستلزمات الطبية والجراحية والمنتجات الورقية الأساسية من خلال نهج تجاري احترافي.",exploreProducts:"استكشف المنتجات",talkToUs:"تواصل مع فريقنا",heroProof:"شركة تجارية مقرها دبي • خدمة تركز على الأعمال",visualTitle:"مستلزمات الرعاية الصحية",visualSub:"مصادر بعناية. توريد بثقة.",licensedCategories:"فئات الأنشطة التجارية المرخصة",businessReady:"جاهزون للأعمال",professionalService:"نهج خدمة احترافي",heroBottom:"طبي • جراحي • شبه صيدلاني • ورقي",
whoWeAre:"من نحن",introTitle:"شريك موثوق لتجارة المنتجات الأساسية.",introText:"شركة بالس آند لايف لتجارة الأدوية ذ.م.م. هي شركة تجارية مقرها دبي، وتركز على توريد مجموعة من المنتجات شبه الصيدلانية والمستلزمات الطبية والجراحية والمنتجات الورقية. نسعى إلى بناء علاقات تجارية موثوقة من خلال التواصل الواضح والاهتمام بالعملاء.",discoverCompany:"اكتشف شركتنا",basedInDubai:"مقرنا دبي، الإمارات العربية المتحدة",ourFocus:"أنشطتنا التجارية",categoryTitle:"ما نتاجر به",viewAll:"عرض جميع الخدمات ←",cat1:"تجارة المنتجات شبه الصيدلانية",cat2:"تجارة المستلزمات والمقالات الطبية والجراحية",cat3:"تجارة المنتجات الورقية",cat1Desc:"مجموعة من المنتجات شبه الصيدلانية لتلبية احتياجات التوريد للأعمال والرعاية الصحية.",cat2Desc:"المستلزمات والمقالات الطبية والجراحية للاحتياجات المهنية.",cat3Desc:"منتجات ورقية لدعم احتياجات الأعمال والعمليات اليومية.",
whyPartner:"لماذا تتعامل معنا",whyTitle:"أعمال مبنية على الثقة والاستمرارية.",whyText:"نركز على سرعة التواصل وموثوقية التوريد والنهج المهني في كل تعامل تجاري.",learnWhy:"لماذا تختارنا",quality:"الالتزام بالجودة",qualityDesc:"نهتم بمتطلبات المنتجات والتنسيق مع الموردين بعناية.",sourcing:"مصادر توريد موثوقة",sourcingDesc:"نركز على التوريد المناسب والتواصل التجاري الواضح.",satisfaction:"رضا العملاء",satisfactionDesc:"نبني علاقات طويلة الأمد من خلال خدمة مهتمة.",approach:"نهج تجاري احترافي",approachDesc:"أسلوب عمل مسؤول وشفاف ويركز على الأعمال.",letsConnect:"لنتواصل",ctaTitle:"هل تبحث عن شريك تجاري موثوق؟",ctaText:"أخبرنا بمتطلبات المنتجات أو الأعمال الخاصة بك. يسعد فريقنا بالتواصل معك.",sendInquiry:"أرسل استفسارك",
aboutEyebrow:"تعرف علينا",aboutHero:"شريك تجاري متخصص واحترافي.",aboutLead:"نبني علاقات تجارية موثوقة في فئات الرعاية الصحية والمنتجات الورقية الأساسية.",photoTag:"مقر أعمالنا",companyProfile:"نبذة عن الشركة",profileTitle:"متخصصون في التجارة. ملتزمون بالخدمة.",profileText:"شركة بالس آند لايف لتجارة الأدوية ذ.م.م. شركة ذات مسؤولية محدودة مقرها دبي، الإمارات العربية المتحدة. تشمل أنشطتنا المرخصة تجارة المنتجات شبه الصيدلانية والمستلزمات الطبية والجراحية والمنتجات الورقية.",profileText2:"نعمل على فهم متطلبات الأعمال وتنسيق مصادر المنتجات المناسبة ودعم العملاء من خلال تواصل واضح واحترافي.",factCategories:"فئات الأنشطة المرخصة",factLocation:"شركة مقرها دبي",ourDirection:"توجهنا",directionTitle:"ما يوجه أعمالنا",vision:"رؤيتنا",visionText:"بناء علاقات تجارية مستدامة من خلال أن نكون شريكاً موثوقاً لتلبية احتياجات المنتجات الأساسية.",mission:"رسالتنا",missionText:"خدمة العملاء من خلال التواصل السريع وتنسيق التوريد المسؤول والخدمات التجارية الاحترافية.",commitment:"التزامنا",commitmentText:"التعامل مع كل استفسار بعناية ووضوح واهتمام بمتطلبات العميل المحددة.",ourValues:"قيمنا",valuesTitle:"مبادئ تقوم عليها كل علاقة.",valueIntegrity:"النزاهة",valueReliability:"الموثوقية",valueService:"الخدمة",valueTransparency:"الشفافية",valueResponsibility:"المسؤولية",
productEyebrow:"أنشطتنا المرخصة",productHero:"فئات منتجات مصممة لتلبية احتياجاتكم.",productLead:"استكشف فئات التجارة المدرجة في رخصة أعمالنا في دبي.",paraText:"التجارة في فئات المنتجات شبه الصيدلانية لدعم متطلبات التوريد للعملاء والشركات. يمكن مناقشة توفر المنتجات ومواصفاتها مع فريقنا.",medicalText:"التجارة في المستلزمات والمقالات الطبية والجراحية لتلبية الاحتياجات المهنية والمؤسسية والتجارية. تواصلوا معنا لمناقشة المنتجات المطلوبة.",paperText:"التجارة في المنتجات الورقية لتلبية احتياجات الأعمال والعمليات اليومية. شاركونا المواصفات والكميات المطلوبة.",askAvailability:"استفسر عن التوفر",discussNeeds:"ناقش متطلباتك",requestInfo:"اطلب مزيداً من المعلومات",licenseNote:"أنشطة الشركة هي أنشطة تجارية كما هو مدرج في الرخصة التجارية الصادرة في دبي. يرجى التأكد مباشرة من فريقنا بشأن توفر المنتجات ومواصفاتها والمتطلبات المعمول بها.",
whyEyebrow:"نهج بالس آند لايف",whyHero:"نهج احترافي في كل خطوة.",whyLead:"نؤمن بأن العلاقات التجارية القوية تُبنى على الاستمرارية والتواصل والاهتمام.",ourPrinciples:"مبادئنا",principlesTitle:"ما يمكنكم توقعه منا",qualityLong:"نهتم بمتطلبات المنتجات ونسعى إلى تنسيق التوريد وفقاً للمواصفات التي يشاركها العملاء.",sourcingLong:"نركز على فهم المتطلبات وتنسيق مصادر التوريد المناسبة من خلال عملية مدروسة.",satisfactionLong:"نقدر العلاقات طويلة الأمد ونسعى إلى توفير تواصل مستمر خلال كل استفسار.",approachLong:"نسعى إلى الوضوح وسرعة الاستجابة والاحترافية في تعاملاتنا مع العملاء وشركاء الأعمال.",ourPromise:"وعدنا",promiseTitle:"تواصل واضح. حلول مدروسة. علاقات موثوقة.",promiseText:"لكل شركة احتياجات مختلفة. نخصص الوقت لفهم الطلب والتواصل بوضوح والعمل نحو حل مناسب ضمن أنشطتنا التجارية المرخصة.",startConversation:"ابدأ محادثة",
contactEyebrow:"نحن هنا للمساعدة",contactHero:"دعونا نناقش متطلباتكم.",contactLead:"أرسلوا استفساركم وسيتواصل معكم فريقنا.",contactDetails:"بيانات الاتصال",contactTitle:"تواصلوا مع فريقنا.",contactText:"للاستفسار عن توفر المنتجات أو الأعمال أو أي أسئلة عامة، يرجى استخدام البيانات أدناه أو إرسال رسالة إلينا.",office:"مكتب دبي",addressPending:"دبي، الإمارات العربية المتحدة\nسيتم تأكيد عنوان المكتب بالتحديد",phone:"الهاتف",email:"البريد الإلكتروني",businessHours:"استفسارات الأعمال",businessHoursText:"تواصلوا معنا هاتفياً أو عبر البريد الإلكتروني للحصول على المساعدة.",sendMessage:"أرسلوا لنا رسالة",formIntro:"يرجى تعبئة النموذج لإرسال استفساركم.",fullName:"الاسم الكامل *",emailAddress:"البريد الإلكتروني *",phoneNumber:"رقم الهاتف",subject:"الموضوع",yourMessage:"رسالتكم *",submitInquiry:"إرسال الاستفسار",privacyNote:"ستُستخدم معلوماتكم للرد على استفساركم.",findUs:"موقعنا",mapTitle:"موقعنا في دبي",mapPending:"ستتم إضافة الموقع الدقيق للمكتب بعد تأكيده.",mapPlaceholder:"سيتم إعداد موقع خرائط Google",
footerAbout:"شركة تجارية مقرها دبي للمنتجات شبه الصيدلانية والمستلزمات الطبية والجراحية والمنتجات الورقية.",quickLinks:"روابط سريعة",newsletterTitle:"ابقوا على تواصل",newsletterText:"اشتركوا لتلقي تحديثات الشركة والإعلانات.",footerNote:"أنشطة تجارية مرخصة • دبي، الإمارات",chatTitle:"تحدث مع فريقنا",chatSub:"اترك لنا رسالة وسنعاود التواصل معك.",chatWelcome:"مرحباً! كيف يمكننا مساعدتك اليوم؟"
}
};

function applyLanguage(lang){
  const dict=translations[lang]||translations.en;
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  document.querySelectorAll("[data-i18n]").forEach(el=>{const k=el.dataset.i18n;if(dict[k]!==undefined)el.innerHTML=dict[k].replace(/\n/g,"<br>");});
  const select=document.getElementById("languageSelect");if(select)select.value=lang;
  try{localStorage.setItem("pl-language",lang)}catch(e){}
}
const langSelect=document.getElementById("languageSelect");
let savedLang="en";try{savedLang=localStorage.getItem("pl-language")||"en"}catch(e){}
applyLanguage(savedLang);langSelect?.addEventListener("change",e=>applyLanguage(e.target.value));

document.querySelector(".menu-toggle")?.addEventListener("click",()=>document.querySelector(".nav")?.classList.toggle("open"));
document.getElementById("year")?.append(String(new Date().getFullYear()));

function getPageName(){
  const route = location.pathname.replace(/\/$/, "") || "/";
  const knownRoutes = new Set(["/", "/about", "/products", "/why-us", "/contact"]);
  return knownRoutes.has(route) ? route : "/";
}

async function postToSheet(payload){
  const response=await fetch("/api/sheets",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload),
    cache:"no-store"
  });
  let result={};
  try{result=await response.json();}catch(_){}
  if(!response.ok || !result.ok)throw new Error(result.error||"The message could not be saved. Please try again.");
  return result;
}

document.getElementById("contactForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const form=e.currentTarget,status=document.getElementById("contactStatus"),btn=form.querySelector("button[type='submit']");
  const data=Object.fromEntries(new FormData(form).entries());
  data.type="contact";data.page=getPageName();
  btn.disabled=true;status.textContent="Sending...";
  try{
    await postToSheet(data);
    status.textContent="Thank you. Your inquiry has been submitted successfully.";
    form.reset();
  }catch(err){
    console.error("Contact submission failed:",err);
    status.textContent=err.message||"We could not send your inquiry. Please try again.";
  }finally{btn.disabled=false;}
});

document.getElementById("newsletterForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const form=e.currentTarget,status=document.getElementById("newsletterStatus"),btn=form.querySelector("button[type='submit']");
  const values=Object.fromEntries(new FormData(form).entries());
  btn.disabled=true;status.textContent="Submitting...";
  try{
    await postToSheet({type:"subscription",name:values.name,email:values.email,phone:values.phone,source:"Website footer",page:getPageName()});
    status.textContent="Thank you for subscribing.";
    form.reset();
  }catch(err){
    console.error("Newsletter submission failed:",err);
    status.textContent=err.message||"Please try again later.";
  }finally{btn.disabled=false;}
});


/* Load the chat widget as an independent module after the shared form helpers exist. */
if (document.body.dataset.chatWidget !== "disabled") {
  const pulseChatScript=document.createElement("script");
  pulseChatScript.src="/chatbot.js";
  pulseChatScript.async=true;
  document.body.appendChild(pulseChatScript);
}
