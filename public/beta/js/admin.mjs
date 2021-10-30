import {pubComm, createElement} from './main.mjs';

// var csrfToken = '';

// if(document.getElementsByName('_csrf')[0].value) {
//     csrfToken = document.getElementsByName('_csrf')[0].value;
// }

// var pubComm = io('/redcol', {
//     query: {['_csrf']: csrfToken}
// });

// TESTAREA CONEXIUNII
// setInterval(() => {
//     console.log("Conectat: ", pubComm.connected, " cu id-ul: ", pubComm.id);
//     pubComm.emit('testconn', 'test');
// }, 2000);

/* === CĂUTAREA UNUI UTILIZATOR === */
var findUser = document.getElementById('findUser');
var findUserBtn = document.querySelector("#findUserBtn");

/* === CERE PROFILUL USERULUI === */
function clbkFindUser (evt) {
    evt.preventDefault();
    pubComm.emit('person', document.querySelector('#findUserField').value);
}
findUserBtn.addEventListener('click', clbkFindUser);

// Tratează cazul browserelor mai vechi
findUser.addEventListener('keypress', (evt) => {
    let charCodeNr = typeof evt.charCode == "number" ? evt.charCode : evt.keyCode;
    // console.log('Caracter ', charCodeNr);
    let identifier = evt.key || evt.keyIdentifier; // compatibilitate cu Safari
    if (identifier === "Enter" || charCodeNr === 13) {
        // console.log(pubComm);
        pubComm.emit('person', document.querySelector('#findUserField').value);
    };
});

/* === PROFILUL ESTE PRIMIT și AFIȘAT === */
pubComm.on('person', (data) => {
    renderUsr.innerHTML = ''; // șterge profilul anterior din DOM
    showUser(data);
    // Afișează eroare în cazul în care înregistrarea nu este indexată.
    if (data.length === 0) {
        $.toast({
            heading: 'Neindexat, poate?',
            text: "Schimbă cheia de căutare!",
            position: 'top-center',
            showHideTransition: 'fade',
            icon: 'error',
            hideAfter: 7000
        });
    }
});

var userTmpl = document.querySelector('#usertpl');    // Pas 1 - Fă o referință către template
var renderUsr = document.getElementById('showusers'); // Pas 2 - Fă o referință către elementul din DOM unde va fi inserat conținutul rezultat din compilarea template-ului

/**
 * Funcția creează carduri pentru fiecare utilizator găsit la căutare.
 * @param {Array} resurse Este un array al datelor utilizatorilor găsiți
 */
function showUser (resurse) {
    resurse.map((user) => {
        // console.log("[admin.mjs] Utilizatorul primit este următorul", user);

        var cloneContent = userTmpl.content.cloneNode(true); // Pas 3 -  Clonează conținutul din template
        
        // titul card-ului va fi adresa de email a userului
        var title = cloneContent.querySelector('.card-title');
        title.textContent = user._source.email;

        // Butonul cardului va fi numele de familie în cazul unui cont de Google. Pe buton ascultă `exposeUser()`
        var family_name = cloneContent.querySelector('.userProfileBtn');

        family_name.name = user._id;
        if (user._source.googleProfile.name) {
            family_name.textContent = user._source.googleProfile.name;
        } else {
            family_name.textContent = user._id;
        }

        // Injectează rezultatul în DOM
        renderUsr.appendChild(cloneContent);
    });
}

/**
 * Funcția are rolul de a aduce toate datele despre utilizator și ultimele 5 contribuții RED.
 * Este un listener pe butoanele cu numele de familie.
 * Emite pe `personrecord`.
 */
function exposeUser () {
    // adu toate datele despre user (administrative și contribuții)
    pubComm.emit('personrecord', event.target.name); // este ascultat mai jos
}

globalThis.exposeUser = exposeUser; // _ HACK: expose global

var userFile; // (userFile.resurse)
var tmlOptions = {
    // height: 350,
    // timenav_height: 200,
    // timenav_height_percentage: 22,
    zoom_sequence: 5,
    scale_factor: 2
}; // opțiuni necesare obiectului Timeline
let TimelineObj = {
    // scale: "human",
    title: {
        media: {
            url: '',
            caption: '',
            credit: ''
        },
        text: {
            headline: '',
            text: ''
        }
    },
    events: [],
};

// Primirea detaliilor privind utilizatorul ales
pubComm.on('personrecord', function clblPersReds (resurse) {
    renderUsrDetails.innerHTML = '';
    userFile = resurse;
    // console.log('Din admin.js [on(personrecord)] -> resurse ', resurse);

    //- TODO: Transformă `resurse` într-un subset necesar lui Timeline
    if (resurse.googleProfile) {
        // console.log('Din admin.js [on(personrecord)] -> resurse.googleProfile ', resurse.googleProfile);
        TimelineObj.title.text.headline = resurse.googleProfile.name;
    } else {
        TimelineObj.title.text.headline = resurse.username;
    }
    
    TimelineObj.title.text.text = `Acestea sunt resursele contribuite afișate temporal`;

    resurse.resurse.map(function clbkResursa2Timeline (resursa) {
        let discipline = resursa.discipline.join(', '); // flat-out discipline
        let images = [];

        // doar dacă ai blocuri, alimentezi array-ul imaginilor
        if (resursa.blocks) {
            resursa.content.blocks.map( part => {
                if (part.type === 'image') {
                    images.push(part);
                }
            });
        }
        let data = new Date(`${resursa.date}`);
        let transformedObject = {
            media: {
                url: images.length ? `${images[0].data.file.url}` : '',
                caption: images.length ? `${images[0].data.file.caption}` : '',
                credit: '',
                thumbnail: '',
                alt: images.length ? `${images[0].data.file.caption}` : '',
                title: `${resursa.title}`,
                link: `/resurse/${resursa._id}`,
                link_target: '_blank'
            },
            unique_id: resursa._id,
            start_date: {
                year: data.getFullYear(),
                month: data.getMonth(),
                day: data.getDay(),
                hour: data.getHours(),
                minute: data.getMinutes(),
                second: data.getSeconds(),
                millisecond: ''
            },
            text: {
                headline: `${resursa.title}`,
                text: `
                    <p class="tmlAuth">${resursa.autori}</p>
                    <p class="tmlDescr">Descriere: ${resursa.description}</p>
                    <p class="tmlDisc">Discipline: ${discipline}</p>
                    <p class="tmlLic">${resursa.licenta}</p>
                `
            },
            background: {
                url: `${resursa.coperta}`
            }
        };
        TimelineObj.events.push(transformedObject);
    });

    showUserDetails(resurse); // AFIȘEAZĂ resursele (tip card Bootstrap 4) pe care le-a creat utilizatorul

    // RANDEAZA TIMELINE_UL
    new TL.Timeline('timeline-embed', TimelineObj, tmlOptions);

    // RANDEAZĂ TABELUL
    // console.log(resurse.resurse);
    // https://datatables.net/manual/data/orthogonal-data
    $('.userResTbl').DataTable({
        data: resurse.resurse,
        columns: [
            {
                title: 'ID',
                data: '_id',
                render: function clbkId (data, type, row) {
                    return `<a href="${window.location.origin}/profile/resurse/${data}" class="btn btn-primary btn-sm active" role="button" aria-pressed="true">${data.slice(0,5)}...</a>`;
                }
            },
                {
                    title: 'Verificată',
                    data: 'expertCheck',
                    render: function clbkExpertChk (data, type, row) {
                        // if ( type === 'display' || type === 'filter' ) {

                        // }
                        if (data) {
                            return `<p class="resvalid">validată</p>`;
                        } else {
                            return `<p class="resinvalid">nevalidată</p>`;
                        }
                    }
                },
                { 
                    title: 'Publică',
                    data: 'generalPublic',
                    render: function clbkGenPub (data, type, row) {
                        if (data) {
                            return `<p class="respublic">public</p>`;
                        } else {
                            return `<p class="resinvalid">internă</p>`;
                        }
                    }
                },
            {
                title: 'Titlul',
                data: 'title',
                render: function clbkTitleRender (data, type, row) {
                    return `<p class="restitle">${data}</p>`
                }
            },
            {
                title: 'Autor',
                data: 'autori'
            },
            {
                title: 'Descriere',
                data: 'description'
            },
            {
                title: 'Licență',
                data: 'licenta'
            }
        ]
    });
});

/* === TEMPLATE-urile folosite pentru afișare detalii de user === */
var usrDetailsTmpl   = document.querySelector('#userdetailtpl');  // ref către template-ul detaliilor
var usrResTblTmpl    = document.querySelector('#userResTbl');     // ref către template-ul resurselor în format tabelar
var renderUsrDetails = document.querySelector('#showusrdetails'); // ref către ancora din DOM unde se va face injectarea resurselor

/**
 * Funcția are rolul de a afișa detaliile despre un utilizator [roluri în sistem, ultimele 5 contribuții]
 * @param {Object} descriere Este un array de obiecte cu resurse
 */
function showUserDetails (descriere) {
    // clonează conținutul din template
    var cloneContent = usrDetailsTmpl.content.cloneNode(true); // clonarea template-ului pentru detalii user
    var cloneTbl = usrResTblTmpl.content.cloneNode(true); // clonarea template-ului pentru afișare tabelară

    // injectează datele primite în elementele template-ului
    // === AVATAR ===
    var userAvatar = cloneContent.querySelector('.admUdesc__avatar'); // Numele utilizatorului

    // userAvatar.src = descriere.googleProfile.picture;
    if (descriere.googleProfile) {
        userAvatar.src = descriere.googleProfile.picture;
        userAvatar.alt = descriere.googleProfile.name
    } else if (descriere.avatar) {
        userAvatar.src = descriere.avatar;
    } else {
        userAvatar.src = ''; // FIXME: Generează ceva aleatoriu sau ia de pe net random o imagine, ceva
    }
    descriere.googleProfile ? userAvatar.alt = descriere.googleProfile.name : descriere.username;      // cazul localului

    // === ID ===
    var userID = cloneContent.querySelector('.admUdesc__admUid');
    userID.textContent = descriere._id;

    // === ROLES ===
    var uRoles = cloneContent.querySelector('.admUsesc__admUroles');
    descriere.roles.rolInCRED.map(function clbkRolesTmpl (rol) {
        let rolTag = document.createElement('span');
        rolTag.classList.add('badge');
        rolTag.classList.add('badge-success');
        rolTag.classList.add('admUsesc__admUroles--role');
        rolTag.textContent = rol;
        uRoles.appendChild(rolTag);
    });

    // === UNITS ===
    var uUnits = cloneContent.querySelector('.admUsesc__admUunits');
    descriere.roles.unit.map(function clbkUnitsTmpl (unit) {
        let unitTag = document.createElement('span');
        unitTag.classList.add('badge');
        unitTag.classList.add('badge-warning');
        unitTag.classList.add('admUsesc__admUroles--unit');
        unitTag.textContent = unit;
        uUnits.appendChild(unitTag);
    });

    /* === RESURSE AFIȘARE [CARD-uri Bootstrap 4] === */
    var uResurse = cloneContent.querySelector('.resurseUser');

    // Extrage ultimele 5 resurse
    var last5REDs = descriere.resurse.slice().sort((a, b) => b.date - a.date).slice(0,5);
    // console.log(last5REDs.length, last5REDs);

    last5REDs.map( function clbkResUser (resursa) {
        // Creează containerul cardului
        let divCard = document.createElement('div');
        divCard.classList.add('card');

        // Creează headerul cardului
        let divCardHeader = document.createElement('div');
        divCardHeader.classList.add('card-header');
        let h5CardHeader = document.createElement('h5');
        h5CardHeader.classList.add('card-title');
        let aH5CardHeader = document.createElement('a');
        aH5CardHeader.href = `/profile/resurse/${resursa._id}`;
        aH5CardHeader.role = 'button';
        aH5CardHeader.classList.add('btn');
        aH5CardHeader.classList.add('btn-dark');
        aH5CardHeader.textContent = resursa.title;
        h5CardHeader.appendChild(aH5CardHeader); // injectează elementul a în h5
        divCardHeader.appendChild(h5CardHeader); // injectează elementul h5 în .card-header
        divCard.appendChild(divCardHeader); // inkectează .card-header în .card

        // Creează body-ul card-ului
        let divCardBody = document.createElement('div');
        divCardBody.classList.add('card-body');
        divCard.appendChild(divCardBody);

        // creează descriere în card
        let resDescr = document.createElement('p');
        resDescr.textContent = resursa.description;
        divCardBody.appendChild(resDescr);

        // injectează
        uResurse.appendChild(divCard);
    });

    // ===== SET ADMIN =====
    var admCheck = cloneContent.querySelector('#adminSet');
    if (descriere.roles.admin) {admCheck.checked = true; }

    // Resurse afișate tabelar
    var uResTbl = cloneTbl.querySelector('#resurseTab'); // ref către div-ul gazdă al tabelului 
    let divResurseTabelare = document.createElement('table'); // creează tabel
    divResurseTabelare.classList.add('userResTbl'); // adaugă clasă la tabel
    uResTbl.appendChild(divResurseTabelare); // append tabel la div-ul gazdă

    // injectează template-urile în DOM
    renderUsrDetails.appendChild(cloneContent);
    renderUsrDetails.appendChild(uResTbl); // injectează tabelul resurselor tabelare
}

/**
 * Funcția are rolul de a trimite pe Socket modificarea rolului de Administrator de aplicație
 * @param {String} userId 
 */
function mkAdmin (userId) {
    // console.log(userFile);
    // console.log(event.target.checked);
    if(event.target.checked){
        pubComm.emit('mkAdmin', {
            id: userFile._id,
            admin: true
        });
    } else {
        pubComm.emit('mkAdmin', {
            id: userFile._id,
            admin: false
        });
    }
}

pubComm.on('mkAdmin', (result) => {
    console.log(result);
});

// === ADAUGĂ ROLURI
var rolesSet = new Set(); // setul rolurilor care vor fi adăugate în profilul utilizatorului
var unitsSet = new Set(); // setul unit-urilor care vor fi adăugate în profil.

/**
 * Funcția are rolul de a colecta rolurile selectare din `options` și de a constitui un set unic definit prin variabila `rolesSet`
 */
function colectRoles () {
    // culege ce valori au fost selectate
    var element = document.querySelectorAll('#existingRoles option:checked');
    const values = Array.from(element).map(val => {
        if(!rolesSet.has(val.value)) {
            rolesSet.add(val.value);
        }
        return val.value;
    });
    // Șterge din set restul valorilor care diferă de cele din array-ul `values`. P1 - transformă setul în array
    for (let r of rolesSet.values()) {
        // dacă valoarea din set nu se află în array-ul celor selectate, ȘTERGE-L din set. E în plus.
        if (!values.includes(r)) {
            rolesSet.delete(r);
        }
    }
}

/**
 * Funcția are rol de listener al butonului care adaugă roluri suplimentare noi
 */
function addNewRole () {
    pubComm.emit('addRole', {
        id: userFile._id,
        roles: Array.from(rolesSet)
    });
}

/**
 * Funcția are rolul de a adăuga unit-uri
 */
function colectUnits () {
    var unitsString = document.querySelector('#units').value;
    var arrUnits = unitsString.split(",");
    // console.log(arrUnits);
    arrUnits.map(val => {
        if(!unitsSet.has(val)) {
            unitsSet.add(val);
        }
    });
    // Șterge din set restul valorilor care diferă de cele din array-ul `arrUnits`. P1 - transformă setul în array
    for (let r of unitsSet.values()) {
        // dacă valoarea din set nu se află în array-ul celor selectate, ȘTERGE-L din set. E în plus.
        if (!arrUnits.includes(r)) {
            unitsSet.delete(r);
        }
    }
    // console.log(Array.from(unitsSet));
    pubComm.emit('addUnit', {
        id: userFile._id,
        units: Array.from(unitsSet)
    });
}

// REVIEW: Sunt doar pentru test! Ia o decizie pentru production
pubComm.on('addUnit', (resurce) => {
    console.log('[admin.mjs::evenimentul `addUnit`]', resurce);
});

pubComm.on('addRole', (resurce) => {
    console.log('[admin.mjs::evenimentul `addRole`]', resurce);
});

// DATELE STATISTICE PRIVIND COLECȚIILE
pubComm.emit('stats', {descriptors: ['reds', 'users', 'compets']}); // Se pasează descriptorii pentru care se dorește aducerea datelor corespondente. Prin convenție, fiecare descriptor înseamnă un set de date.
// la primirea datelor statistice, se generează articole.
pubComm.on('stats', (stats) => {
    restatsEntry = document.querySelector('#restats');

    if (stats.hasOwnProperty('reds')) {
        const resObi = {
            descriptor: 'reds',
            categorie:  'Resurse Educaționale Deschise',
            figure:     stats.reds
        };
        populateStatisticArticle(resObi);
    } else if (stats.hasOwnProperty('users')) {
        const userObi = {
            descriptor: 'users',
            categorie:  'Conturi utilizatori existente',
            figure:     stats.users
        };
        populateStatisticArticle(userObi);
    } else if (stats.hasOwnProperty('compets')) {
        const competsObi = {
            descriptor: 'compets',
            categorie:  'Competențe specifice',
            figure:     stats.compets
        };
        populateStatisticArticle(competsObi);
    }
});

var restatsEntry; // Ancora din DOM a elementului deja existent
// restatsEntry.innerHTML = '';
var statsTmpl = document.querySelector('#statstpl'); // ref la template

/**
 * Funcția `populateStatisticArticle` are rolul de a popula template-ul dedicat datelor statistice pentru un anumit descriptor
 * Funcția este acționată la primirea pe evenimentul `stats` prin cascadarea switch...case.
 * @param {Object} data Sunt datele care vin din backend pentru datele statistice sumare
 */
function populateStatisticArticle (data) {
    // Următoarea este necesară pentru a nu dubla numărul elementelor generate la reload sau back
    Array.prototype.forEach.call(document.getElementsByClassName(data.descriptor), elem => elem.remove());

    // clonează nodul în care vom crea dinamic elementele DOM 
    var cloneStatsContent = statsTmpl.content.cloneNode(true); // clonarea template-ului pentru statistici

    // <article> care joacă rol de container
    let articleInStats = cloneStatsContent.querySelector('.stats__article');
    articleInStats.classList.add(data.descriptor);

    // <h5> care joacă rol de titlu
    let titleInStats = cloneStatsContent.querySelector('.stat__title');
    titleInStats.textContent = data.categorie;

    // <a> care joacă rol de link către o pagină dedicată afișării tuturor respectivelor resurse.
    let aInParaInStats = cloneStatsContent.querySelector('.stat__figure');
    aInParaInStats.href = `/administrator/${data.descriptor}`; //- TODO: pagina care se va deschide, va fi dedicată unor vizualizări pe datele despre toate resursele
    aInParaInStats.setAttribute("href", `/administrator/${data.descriptor}`);
    aInParaInStats.textContent = data.figure;

    restatsEntry.appendChild(cloneStatsContent);
};

/* === Date statistice privind activitatea Elasticsearch === */

/**
 * Funcția este folosită pentru a transforma bytes în human
 * @param {number} bytes 
 */
function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

/* REFERINȚE DOM NECESARE INSERȚIEI DATELOR STATISTICE */
var es7StatsTmpl  = document.querySelector('#es7tpl'),      // ref către template-ul de afișare a statisticilor Elasticsearch 7
    systemElk     = document.querySelector('#system-elk'),  // ref către locul de inserție al template-ului `es7StatsTmpl`
    elkTab        = document.querySelector('#elk-tab'),     // ref buton tab din meniu (Elasticsearch 7)

    mdb4StatsTmpl = document.querySelector('#mongo4tpl'),   // ref către template-ul de afișare a statisticilor MongoDB
    systemMgdb    = document.querySelector('#system-mgdb'), // ref către locul de inserție al template-ului `mdb4StatsTmpl`
    mgdbTab       = document.querySelector('#mgdb-tab'),    // ref buton tab meniu (MongoDB 4)

    mdlTmpl       = document.querySelector("#mdl"),         // ref către template-ul de afișare al modalului
    mdl           = mdlTmpl.content;                        // ref la conținut template modal

/**
 *La apelare, funcția are rolul de a crea un nou tr în tabelul din template-ul `es7statsTmpl` (în pagină `es7tpl`)
 *
 * id va fi vechiul d[0], iar obiectul cu date va fi vechiul d[1]
 */
function createRow4Idx (id, data, tBody) {
    // console.log("ID-ul este", id, "iar datele sunt", data);

    // Funcția populează un modal de confirmare care să fie adaptat pentru fiecare situație.
    generateModal({
        clone: mdl.cloneNode(true),
        id:    id,
        para1: `modl-delidx-${id}`,
        para2: `Ștergi indexul?`,
        para3: 'Fii foarte atent pentru că la ștergerea indexului se va dispărea și alias-ul. Ești sigur că vrei să ștergi?',
        para4: 'Șterge',
        para5: 'Renunță'
    }); // clone (trebuie făcută o clonă/iterație) para1: id; para2: title; para3: body; para4: confirmation text; para5: close text  

    let trow = document.createElement('tr');    // inițiază rândul        
    trow.id  = "tr-" + id;                      // atribuie id
    
    /* ==== ACȚIUNI pe index ==== BEGIN */
    let td0           = document.createElement('td');    // introdu acțiunile asupra indexurilor => primul TD     
    let actIdx        = document.createElement('p');     // acțiunile vor fi introduse într-un paragraf gazdă
    actIdx.classList  = "actidx";

    let btnRidx       = document.createElement('button'); // reindexare [REINDEX]
    btnRidx.classList = "btn btn-warning";
    btnRidx.id        = 'ridx-' + id;
    btnRidx.innerText = "Reindexare";

    let btnBkup       = document.createElement('button'); // backup     [BACKUP]
    btnBkup.classList = "btn btn-info m-2";
    btnBkup.id        = "bkpidx-" + id;
    btnBkup.innerText = "Backup";

    //- FIXME: Adaugă eveniment și listener
    let btnDel        = document.createElement('button'); // ștergere   [DELETE]
    btnDel.classList  = "btn btn-danger m-2";
    btnDel.type       = "button";
    btnDel.id         = "delidx-" + id;
    btnDel.setAttribute('data-toggle', 'modal');
    btnDel.setAttribute('data-target', `#modl-delidx-${id}`);
    btnDel.innerText  = "Șterge";

    actIdx.appendChild(btnRidx);
    actIdx.appendChild(btnBkup);
    actIdx.appendChild(btnDel);

    td0.appendChild(actIdx);
    /* ==== ACȚIUNI pe index ==== END */

    let td1 = document.createElement('td'); // nume index     
    td1.textContent = id;
    
    let td2 = document.createElement('td'); // uuid index
    td2.textContent = data.uuid;
    
    let td3 = document.createElement('td'); // nr documente în index
    td3.textContent = data.total.docs.count;
    
    let td4 = document.createElement('td'); // nr documente șterse
    td4.textContent = data.total.docs.deleted;

    let td5 = document.createElement('td'); // dimensiunea indexului
    td5.textContent = bytesToSize(data.total.store.size_in_bytes); 

    trow.appendChild(td0);
    trow.appendChild(td1);
    trow.appendChild(td2);
    trow.appendChild(td3);
    trow.appendChild(td4);
    trow.appendChild(td5);
    // tBody.appendChild(trow);
    // _FIXME: AICI AR TREBUI SĂ AM DEJA STRUCTURA
    tBody.appendChild(trow);
};

/* NOTE: ==== Listener tabul `system-elk` ==== */
// #1 Emite eveniment aducere date specifice Elasticsearch
elkTab.addEventListener('click', (event) => {
    // Emite event de interogare Elasticsearch
    pubComm.emit('elkstat', '');
});
// #2 Tratează datele primite
pubComm.on('elkstat', (data = {}) => {
    systemElk.innerHTML = ''; // clear tab!!!
    // console.log("Datele care trebuie afișate sunt", data.health);

    let es7statsTmpl      = es7StatsTmpl.content,               // ref la template statses7
        cloneEs7statsTmpl = es7statsTmpl.cloneNode(true),       // clonează template-ul
        hdet              = cloneEs7statsTmpl.querySelector('#es7healthdetails'), 
        tBody             = cloneEs7statsTmpl.querySelector('tbody'),
        dh;

    // Încarcă datele generale despre starea clusterul ES7
    for (dh of data.health) {
        let pdet = document.createElement('p');                     // creează un paragraf gazdă
        
        let span1 = document.createElement('span');                 // introdu numele clusterului
        span1.textContent = 'Nume cluster: ' + dh.cluster + ' ';
        
        let span2 = document.createElement('span');                 // introdu câte noduri există
        span2.textContent = 'Nr. noduri: ' + dh['node.total'] + ' ';
        
        let span3 = document.createElement('span');                 // introdu starea nodului
        span3.textContent = 'Stare: ' + dh.status + ' ';

        pdet.appendChild(span1);
        pdet.appendChild(span2);
        pdet.appendChild(span3);
        hdet.appendChild(pdet);
    }

    // Pentru fiecare indice construiește câte un rând în tabel.
    if (data.indices) {
        // Indexurile -> informații despre fiecare index în parte
        let indicesArr = Object.entries(data.indices), d;

        // generează rânduri în tabel pentru fiecare indice ES7
        for (d of indicesArr) {
            // console.log("d[0] este", d[0], "iar d[1]", d[1]);
            createRow4Idx(d[0], d[1], tBody);
        }

        // integrează template-ul completat al tuturor rândurilor adăugate în DOM
        systemElk.appendChild(cloneEs7statsTmpl);
    } else {
        // În cazul în care obiectul este gol
        let messageEmpty = document.createElement('div');
        messageEmpty.innerHTML = `<p>În acest moment nu există niciun index. Acestea vor fi create la momentul încărcărilor resurselor.</p>`
        systemElk.appendChild(messageEmpty);
    }
});

/**
 * Funcția `idxactions` are rol de listener pentru tab-ul identificat ca `system-elk`
 * Funcția listener va colecta si analiza evenimentele `click` pe elementele interne.
 * În funcție de cine emite eveniment, o decizie se va lua care influiențează indexurile ES7
 * @param evt 
 */
function idxactions (evt) {
    let idx, id, endIdx, vs, alsr; 
    // [`idx`::es7 index] | [`id`::`evt.target.id`] | [`endIdx`::indexul la care începe nr versiunii] | [`vs`::versiunea extrasă] | [`alsr`::alias index necesar versionării]

    // extrage numele indexului pe care operezi din id-ul elementului (ex. `ridx-resedus1` => `resedus1`)
    idx = evt.target.id.split("-").pop();
    // extrage identificatorul tipului operațiunii (ex. `ridx-resedus1` => `ridx`)
    id = evt.target.id.split("-").shift();
    
    /*
        Creează valorile de lucru pentru index, alias-ul său și numărul versiunii
        verifică dacă numele indexului are cifre în coadă. Primul caz este că nu are (indecși vechi sau constituiți greșit)
    */
    if (idx.search(/\d{1,}/g) === -1) {
        endIdx = idx.length;
        vs     = undefined;
        alsr   = undefined;
    } else {
        endIdx = idx.search(/\d{1,}/g); // indexul de la care începe cifra versiunii
        vs     = idx.slice(endIdx);     // versiunea extrasă din numele indexului
        alsr   = idx.slice(0, endIdx);  // aliasul este numele indexului fără versiune
    };
    // console.log("[admin.mjs::idxactions()] Alias-ul ar trebui să fie ", alsr, ', iar versiunea indexului este: ', vs);

    switch (id) {
        case "ridx":
            // verifică mai întâi dacă există un alias; dacă nu există, mai întâi creează-l
            let obi = {vs, alsr};
            console.log("Datele care ar trebui să plece pe `es7reidx` sunt: ", obi)
            pubComm.emit('es7reidx', obi); // Formula este `alsr` + `vs` = numele indexului.
            break;
        case "bkpidx":
            console.log("[admin.mjs::idxactions()] Faci backup?");
            break;
        case "delnow":
            // console.log("Ștergi indexul: ", idx);

            // șterge și row-ul în care era indexul
            let rowt = document.querySelector(`#tr-${idx}`);
            rowt.parentNode.removeChild(rowt);

            // Șterge modalul din DOM
            let mdlDel = document.querySelector(`#modl-delidx-${idx}`);
            systemElk.removeChild(mdlDel);

            pubComm.emit('es7delidx', {idx, alsr});
            break;
    }
}
// Atașează receptorul pe elementul <section id="system-elk">
systemElk.addEventListener('click', idxactions);

// Primire date în cazul reindexării.
pubComm.on("es7reidx", function clbkEs7reidx (data) {
    if (data.deleted == true) {
        // console.log("Am primit următoarele date!", data); // {newidx: nvs, oldidx: idx, deleted: r.body.acknowledged}

        // _TODO: Șterge înregistrarea anterioară și introdu-o pe cea nouă.
        let elem = document.querySelector(`#tr-${data.oldidx}`);
        elem.parentNode.removeChild(elem);

        pubComm.emit('elkstat', '');
    }
})

/**
 * Rolul funcției este să populeze template-ul modalului 
 * și să-l insereze în DOM
 * Funcția populează un modal de confirmare care să fie adaptat pentru fiecare situație dictată de funcția unui anumit buton.
 * @param {Object} opts 
 */
function generateModal (opts) {
    // console.log("[admin.js] :: Valoarea obiectului opts este: ", opts);

    var mdlDiv = opts.clone.querySelector('.modal');
    // console.log("[admin.js] :: Valoarea mdlDiv este: ", mdlDiv);
    mdlDiv.id = opts.para1;
    mdlDiv.setAttribute("aria-labelledby", opts.para1 + "Title");

    var mdlTitle = opts.clone.querySelector('.modal-title');
    mdlTitle.id = opts.para1 + "Title";
    mdlTitle.textContent = opts.para2;

    var mdlBody = opts.clone.querySelector('.modal-body');
    mdlBody.textContent = opts.para3;   

    var mdlDoBtn = opts.clone.querySelector('.btn-primary');
    mdlDoBtn.id = "delnow-" + opts.id;
    mdlDoBtn.textContent = opts.para4;

    var mdlCloseBtn = opts.clone.querySelector('.btn-secondary');
    mdlCloseBtn.textContent = opts.para5;

    opts.clone.appendChild(mdlDiv);
    systemElk.appendChild(opts.clone);
};

/**
 * === Listener pentru tab-ul MongoDB 4 === 
*/
mgdbTab.addEventListener('click', (event = {}) => {
    // cer datele
    pubComm.emit('mgdbstat', '');
});
// prelucrez datele colecțiilor MongoDB
pubComm.on('mgdbstat', (data) => {
    // console.dir(data);
    systemMgdb.innerHTML = ''; // clear tab!!!

    let mdb4statsTmpl      = mdb4StatsTmpl.content,         // ref la template
        cloneMdb4statsTmpl = mdb4statsTmpl.cloneNode(true), // clonează template-ul
        mdl                = mdlTmpl.content;               // ref la conținut template modal

    if (data) {
        let tBody = cloneMdb4statsTmpl.querySelector('tbody'), d;

        // pentru fiecare colecție, creează elementul de rând necesar (`actiuni`, `colecție`, `nr. doc.`, `Nume index ES7`, `nr. doc. index/deleted`)
        for (d of data) {
            if (d !== null) {
                // Creează un modal prin care să confirmi backup-ul!!!               
                generateModal({
                    clone: mdl.cloneNode(true),
                    id:    d.name,
                    para1: `modl-backupidx-${d.name}`,
                    para2: `Continui cu backup-ul?`,
                    para3: 'Acesta este un mesaj de confirmare pentru operațiunea de backup care urmează.',
                    para4: 'Constituie-l',
                    para5: 'Renunță'
                });
    
                let trow = document.createElement('tr');    // inițiază rândul
                trow.id  = "tr-" + d.name;                  // atribuie id
    
                /* ACTIUNI pe colectie --- BEGIN */
                let td0          = document.createElement('td');  // introdu acțiunile asupra indexurilor        
                let actCol       = document.createElement('p');   // acțiunile vor fi introduse într-un paragraf
                actCol.classList = "actcol";
    
                let btnBkup       = document.createElement('button'); // `Backup`
                btnBkup.classList = "btn btn-info m-2";
                btnBkup.id        = "bkpidx-" + d.name;
                btnBkup.innerText = "Backup";
    
                actCol.appendChild(btnBkup);
                td0.appendChild(actCol);
                /* ACTIUNI pe colectie --- END */
    
                let td1         = document.createElement('td'); // nume colecție
                td1.textContent = d.name ? d.name : '';
                td1.classList   = "colname";
    
                let td2 = document.createElement('td'); // nr documente în colecție
                td2.textContent = d.no ? d.no : '';
    
                let td3 = document.createElement('td'); // `Nume index ES7`
                if (d.es7name) {
                    td3.textContent      = d.es7name;
                    td3.classList        = "idxname";
                    td3.id               = d.es7name;
    
                    // Dacă am colecție creată în ElasticSearch, apare butonul `ReIdx ES`
                    let btnReIdxES       = document.createElement('button');
                    btnReIdxES.classList = "btn btn-warning m-2";
                    btnReIdxES.id        = `reidxes-${d.name}-${d.es7name}`; // de ex.: `reidxes-resursedus-resedus1` necesar pentru extragerea numărului versiunii.
                    btnReIdxES.innerText = "ReIdx ES";
                    btnReIdxES.addEventListener('click', collsactions);
                    td0.appendChild(btnReIdxES);
                } else {
                    // Dacă nu este colecție creată în ElasticSearch, apare butonul `Indexează ES`
                    let btnIdxES       = document.createElement('button');
                    btnIdxES.classList = "btn btn-warning m-2";
                    btnIdxES.id        = "idxes-" + d.name;
                    btnIdxES.innerText = "Indexează ES";
                    td3.appendChild(btnIdxES);
                }
    
                let td4 = document.createElement('td'); // nr documente în indexul corespondent ES7
                let span1 = document.createElement('span');
                span1.classList.add('badge', 'badge-primary');
                if (d.noEs7Docs) {
                    span1.textContent = d.noEs7Docs.count;
                } else {
                    span1.textContent = '';
                }
                let span2 = document.createElement('span');
                span2.classList.add('badge', 'badge-secondary');
                if (d.noEs7Docs) {
                    span2.textContent = d.noEs7Docs.deleted;
                } else {
                    span2.textContent = '';
                }
                td4.appendChild(span1);
                td4.appendChild(span2);
    
                trow.appendChild(td0);
                trow.appendChild(td1);
                trow.appendChild(td2);
                trow.appendChild(td3);
                trow.appendChild(td4);
                tBody.appendChild(trow);
            }
        }

        systemMgdb.appendChild(cloneMdb4statsTmpl);
    } else {
        // În cazul în care nu ai date
        let messageEmpty = document.createElement('div');
        messageEmpty.innerHTML = `<p>În acest moment nu există nicio colecție.</p>`
        systemMgdb.appendChild(messageEmpty);
    }
});

systemMgdb.addEventListener('click', collsactions, false);

/**
 * Funcția joacă rolul de listener pentru evenimentele click care apar în subtree-ul tab-ului `systemMgdb`.
 * Din id-ul fiecărui element buton apăsat, sunt extrase datele de lucru (nume_actiune-nume_colecție-nume_index_es7)
 * @param {*} evt
 */
function collsactions (evt) {
    let cmd, col, idxExist, endIdx, vs = 0;

    let infoarr = evt.target.id.split("-"); // realizează un array cu numele tuturor componentelor de lucru
    // console.log("Datele de lucru sunt: ", infoarr);

    // extrage identificatorul tipului operațiunii (ex. `reidxes-resursedus` => `reidxes`)
    cmd = infoarr[0];

    // extrage numele colecției pe care operezi din id-ul elementului (ex. `reidxes-resursedus` => `resursedus`)
    col = infoarr[1];

    // extrage numele indexului din ElasticSearch dacă acesta există.
    idxExist = infoarr[2] ?? '';

    // console.log(`[admin.mjs] infoarr[0] și infoarr[1] este`, infoarr[0], infoarr[1], `iar infoarr[2] este`, infoarr[2]);

    /* Tratarea evenimentului în funcție de comanda specificată în ID */
    switch (cmd) {
        case "reidxes":
            /*
                BUTONUL DE REINDEXARE!!!
                Creează valorile de lucru pentru index, alias-ul său și numărul versiunii
                verifică dacă numele indexului are cifre în coadă. Primul caz este că nu are (indecși vechi sau constituiți greșit)
            */
            // if (idxExist.search(/\d{1,}/g) === -1) {
            //     // _FIXME: E o stare de gravă eroare. Numele indexului ES este fără versiune, sau alias-ul poartă numărul versiunii. ȘTERGE ȘI REFĂ!
            //     // declanșează crearea unui index nou pentru că cel care există nu are alias (indecși vechi sau constituiți greșit)
            // }

            // endIdx = idxExist.search(/\d{1,}/g); // indexul de la care începe cifra versiunii
            // vs     = idxExist.slice(endIdx);     // versiunea extrasă din numele indexului
            // alsr   = idxExist.slice(0, endIdx);  // aliasul este numele indexului fără versiune// aliasul este chiar numele colecției            
            // let nvs    = ++vs,                   // numărul versiunii incrementat 
            //     nidx   = col + nvs;              // numele noului index cu versiunea incrementată


            break;
        case "idxes":
            // INDEXARE DE LA 0
            let nidx = col + vs;  // numele noului index cu versiunea incrementată
            // console.log('Emit pe mgdb2es7', {idx: col + vs, alsr: col});
            pubComm.emit('mgdb2es7', {idx: nidx, alsr: col, vs});            
            break;
    }

    pubComm.on('mgdb2es7', (data) => {
        console.log("[admin.mjs] În urma operatiunii de indexare am primit datele", data);
    });
}