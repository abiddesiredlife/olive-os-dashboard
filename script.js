const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vRAdDwX9qitwUOes0kHJDH7s1Xi35zEnjtNxvaAP2nz4vtYW3w35GFkaYN9uWg/pub?output=csv';

async function fetchData(){
  const res = await fetch(csvUrl);
  const text = await res.text();
  return text.trim().split('\n').slice(1).map(r=>r.split(','));
}

function format(val){return Number(val).toLocaleString('en-IN',{maximumFractionDigits:2});}

async function init(){
  const data = await fetchData();
  const sel = document.getElementById('selector');
  const radios = document.getElementsByName('view');
  const tbody = document.querySelector('#dataTable tbody');
  const summary = document.getElementById('summary');

  let view = 'customer';
  function rebuildSelector(){
    const idx = view==='customer'?1:2;
    const opts = Array.from(new Set(data.map(r=>r[idx]))).sort();
    sel.innerHTML = '<option value="">-- Select --</option>';
    opts.forEach(o=>sel.add(new Option(o,o)));
  }

  radios.forEach(r=>{
    r.onchange=()=>{view=r.value;rebuildSelector(); sel.value=''; updateTable();};
  });

  sel.onchange = updateTable;

  function updateTable(){
    tbody.innerHTML='';
    const filter = sel.value;
    let inv=0,pnd=0,os60=0,os90=0;

    data.forEach((r,i)=>{
      const [,,region,,days,invoice,pending] = r;
      if (!filter || (view==='customer'? r[1] : region)===filter){
        inv+=+invoice; pnd+=+pending;
        if(+days>=60 && +days<=90) os60+=+pending;
        if(+days>90) os90+=+pending;
        const tr=document.createElement('tr');
        tr.innerHTML = `<td>${i+1}</td><td>${r[1]}</td><td>${region}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>₹${format(invoice)}</td><td class="${+r[5]>90?'red':''}">₹${format(pending)}</td><td>${r[8]}</td>`;
        tbody.appendChild(tr);
      }
    });

    const dso = inv ? ((pnd/inv)*365).toFixed(2) : 0;
    summary.innerHTML =
      `📦 Total Sales: ₹${format(inv)} | 💰 Total OS: ₹${format(pnd)} | 60–90 Days OS: ₹${format(os60)} | 90+ Days OS: <span class="danger">₹${format(os90)}</span> | 📈 DSO: ${dso} Days`;
  }

  rebuildSelector(); updateTable();
}

init();
