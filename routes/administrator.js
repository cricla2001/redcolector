require('dotenv').config();
const redisClient = require('../redis.config');
const esClient    = require('../elasticsearch.config');
const moment      = require('moment');
const express     = require('express');
const router      = express.Router({mergeParams: true});
const Resursa     = require('../models/resursa-red');
const Mgmtgeneral = require('../models/MANAGEMENT/general'); // Adu modelul management
const Competente  = require('../models/competenta-specifica');
let {getStructure} = require('../util/es7');

// HELPERI
const ES7Helper   = require('../models/model-helpers/es7-helper');
const schema      = require('../models/resursa-red-es7');
// let content2html = require('./controllers/editorJs2HTML');
let editorJs2TXT  = require('./controllers/editorJs2TXT');
let archiveRED    = require('./controllers/archiveRED');

// INDECȘII ES7
let RES_IDX_ES7 = '', RES_IDX_ALS = '', USR_IDX_ES7 = '', USR_IDX_ALS = '';
getStructure().then((val) => {
    USR_IDX_ALS = val.USR_IDX_ALS;
    USR_IDX_ES7 = val.USR_IDX_ES7;
    RES_IDX_ALS = val.RES_IDX_ALS;
    RES_IDX_ES7 = val.RES_IDX_ES7;
}).catch((error) => {
    console.log(`[administrator.js::getStructure] nu a adus datele`, error);
    logger.error(error);
});

// LOGO
let LOGO_IMG = "img/" + process.env.LOGO;

// === VERIFICAREA ROLURILOR ===
let checkRole = require('./controllers/checkRole.helper');
const logger = require('../util/logger');

/* === /administrator === */
router.get('/', (req, res, next) => {
    async function clbkAdmRoot (req, res, next) {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);
    
        let roles = ["admin", "validator"]; // ACL
        
        // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
        let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    
        /* === ADMIN === :: Dacă avem un admin, atunci oferă acces neîngrădit */
        if(req.session.passport.user.roles.admin){
            // === SCRIPTURI și STILURI COMUNE ===
            let scripts = [       
                // MOMENT.JS
                {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`},
                // TIMELINE.JS
                {script: `${gensettings.template}/lib/timeline3/js/timeline.js`},
                // ZIP
                {script: `${gensettings.template}/lib/jszip.min.js`},
                // PDF
                {script: `${gensettings.template}/lib/pdfmake.min.js`},
                {script: `${gensettings.template}/lib/vfs_fonts.js`}
            ];
            let styles = [
                // DATATABLES    
                {style: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.css`},
                {style: `${gensettings.template}/lib/npm/responsive.dataTables.min.css`},
                // TIMELINE
                {style: `${gensettings.template}/lib/timeline3/css/fonts/font.roboto-megrim.css`},
                {style: `${gensettings.template}/lib/timeline3/css/timeline.css`}
            ];
            let modules = [
                // MAIN
                {module: `${gensettings.template}/js/main.mjs`},
                // DATATABLES
                // {module: `${gensettings.template}/lib/npm/jquery.dataTables.min.js`},
                // {module: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.js`},
                // {module: `${gensettings.template}/lib/npm/dataTables.select.min.js`},
                // {module: `${gensettings.template}/lib/npm/dataTables.buttons.min.js`},
                // {module: `${gensettings.template}/lib/npm/buttons.print.min.js`},
                // {module: `${gensettings.template}/lib/npm/buttons.html5.min.js`},
                // {module: `${gensettings.template}/lib/npm/buttons.bootstrap4.min.js`},
                // {module: `${gensettings.template}/lib/npm/dataTables.responsive.min.js`},
                // LOCALE
                {module: `${gensettings.template}/js/admin.mjs`}
            ];
    
            res.render(`administrator_${gensettings.template}`, {
                template: `${gensettings.template}`,
                title:     "Admin",
                user:      req.user,
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                csrfToken: req.csrfToken(),
                scripts,
                modules,
                styles,
                activeAdmLnk: true
            });
    
        /* === VALIDATOR === :: Dacă ai un validator, oferă aceleași drepturi precum administratorului, dar fără posibilitatea de a trimite în public */
        } else if (confirmedRoles.includes('validator')) {
            let scripts = [       
                // MOMENT.JS
                {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`},
                // TIMELINE.JS
                {script: `${gensettings.template}/lib/timeline3/js/timeline.js`},
                // ZIP
                {script: `${gensettings.template}/lib/jszip.min.js`},
                // PDF
                {script: `${gensettings.template}/lib/pdfmake.min.js`},
                {script: `${gensettings.template}/lib/vfs_fonts.js`}
            ];
            let modules = [
                // MAIN
                {module: `${gensettings.template}/js/main.mjs`},
                // DATATABLES
                {module: `${gensettings.template}/lib/npm/jquery.dataTables.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.select.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.buttons.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.print.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.html5.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.bootstrap4.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.responsive.min.js`},
                // LOCALE
                {module: `${gensettings.template}/js/admin.mjs`}
            ];
            let styles = [
                // DATATABLES    
                {style: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.css`},
                {style: `${gensettings.template}/lib/npm/responsive.dataTables.min.css`},
                // TIMELINE
                {style: `${gensettings.template}/lib/timeline3/css/fonts/font.roboto-megrim.css`},
                {style: `${gensettings.template}/lib/timeline3/css/timeline.css`}
            ];
    
            res.render(`validator_${gensettings.template}`, {
                template: `${gensettings.template}`,
                title:     "Validator",
                user:      req.user,
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                csrfToken: req.csrfToken(),
                scripts,
                modules,
                styles,
                activeAdmLnk: true
            });
        } else {
            res.redirect('/401');
        }
    };
    clbkAdmRoot(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);
    });
});

/* === /administrator/reds === */
router.get('/reds', (req, res, next) => {
    async function clbkAdmReds (req, res) {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);
        // DOAR ADMINISTRATORII VAD TOATE RESURSELE ODATĂ FIXME: Creează aceeași posibilitate și validatorilor!!!
        if(req.session.passport.user.roles.admin){

            let scripts = [       
                // MOMENT.JS
                {script: `moment/min/moment-with-locales.min.js`},
                // DATATABLES
                {script: `datatables.net/js/jquery.dataTables.min.js`},
                {script: `datatables.net-dt/js/dataTables.dataTables.min.js`},
                {script: `datatables.net-select-dt/js/select.dataTables.min.js`},
                {script: `datatables.net-buttons-dt/js/buttons.dataTables.min.js`},
                {script: `datatables.net-buttons/js/buttons.print.min.js`},
                {script: `datatables.net-responsive-dt/js/responsive.dataTables.min.js`},
                // ZIP
                {script: `${gensettings.template}/lib/jszip.min.js`},
                // PDF
                {script: `${gensettings.template}/lib/pdfmake.min.js`},
                {script: `${gensettings.template}/lib/vfs_fonts.js`},
                // TIMELINE.JS
                {script: `${gensettings.template}/lib/timeline3/js/timeline.js`}
            ];

            let modules = [
                // MAIN
                {module: `${gensettings.template}/js/main.mjs`},
                // LOCALE
                {module: `${gensettings.template}/js/res-visuals.mjs`}
            ];
            let styles = [
                // DATATABLES    
                {style: `datatables.net-responsive-dt/css/responsive.dataTables.min.css`},
                {style: `datatables.net-dt/css/jquery.dataTables.min.css`},
                {style: `datatables.net-select-dt/css/select.dataTables.min.css`},
                {style: `datatables.net-buttons-dt/css/buttons.dataTables.min.css`},
                // TIMELINE
                {style: `${gensettings.template}/lib/timeline3/css/fonts/font.roboto-megrim.css`},
                {style: `${gensettings.template}/lib/timeline3/css/timeline.css`}
            ];

            res.render(`res-data-visuals_${gensettings.template}`, {
                template: `${gensettings.template}`,
                title:     "Resurse",
                user:      req.user,
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                csrfToken: req.csrfToken(),
                scripts,
                modules,
                styles,
                activeAdmLnk: true
            });
        } else {
            res.redirect('/401');
        }
    };
    clbkAdmReds(req, res).catch((error) => {
        console.log(error);
        logger(error);
        next(error);
    });
});

/* === /administrator/reds/:id === */
router.get('/reds/:id', (req, res, next) => {
    async function clbkAdmOneRes (req, res, next) {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);
        // const editorJs2html = require('./controllers/editorJs2HTML');
        let scripts = [
            // MOMENT.JS
            {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`},
            // {script: '/js/res-shown.js'},
            // HELPER DETECT URLS or PATHS
            {script: `${gensettings.template}/js/check4url.js`},
            // DOWNLOADFILE
            {script: `${gensettings.template}/lib/downloadFile.js`}
        ];

        let modules = [
            // EDITOR.JS
            {module: `${gensettings.template}/lib/editorjs/editor.js`},
            {module: `${gensettings.template}/lib/editorjs/header.js`},
            {module: `${gensettings.template}/lib/editorjs/paragraph.js`},
            {module: `${gensettings.template}/lib/editorjs/checklist.js`},
            {module: `${gensettings.template}/lib/editorjs/list.js`},
            {module: `${gensettings.template}/lib/editorjs/image.js`},
            {module: `${gensettings.template}/lib/editorjs/embed.js`},
            {module: `${gensettings.template}/lib/editorjs/code.js`},
            {module: `${gensettings.template}/lib/editorjs/quote.js`},
            {module: `${gensettings.template}/lib/editorjs/inlinecode.js`},
            {module: `${gensettings.template}/lib/editorjs/table.js`},
            {module: `${gensettings.template}/lib/editorjs/attaches.js`},
            {module: `${gensettings.template}/lib/editorjs/ajax.js`},
            // MAIN
            {module: `${gensettings.template}/js/main.mjs`},
            // LOCALE
            {module: `${gensettings.template}/js/redincredadmin.mjs`},
            // GITGRAPH
            {module: `${gensettings.template}/lib/gitgraph.umd.js`}
        ];
    
        let styles = [
            // FONTAWESOME
            {style: `${gensettings.template}/lib/npm/all.min.css`},
            // JQUERY TOAST
            {style: `${gensettings.template}/lib/npm/jquery.toast.min.css`},
            // BOOTSTRAP
            {style: `${gensettings.template}/lib/npm/bootstrap.min.css`}
        ];
    
        let roles = ["admin", "validator"];
        let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
        
        // adu înregistrarea din MongoDB după ce a fost încărcată o nouă resursă
        Resursa.findById(req.params.id).populate({path: 'competenteS'}).exec().then(resursa => {
            /* === Resursa încă există în MongoDB === */
            if (resursa.id !== null) {
                // transformă obiectul document de Mongoose într-un obiect normal.
                const obi = Object.assign({}, resursa._doc); // Necesar pentru că: https://stackoverflow.com/questions/59690923/handlebars-access-has-been-denied-to-resolve-the-property-from-because-it-is
    
                // obiectul competenței specifice cu toate datele sale trebuie curățat.
                obi.competenteS = obi.competenteS.map(obi => {
                    return Object.assign({}, obi._doc);
                });
    
                // adaug o nouă proprietate la rezultat cu o proprietate a sa serializată [injectare în client a întregii înregistrări serializate]
                obi.editorContent = JSON.stringify(resursa);
    
                // resursa._doc.content = editorJs2html(resursa.content);
                obi.dataRo = moment(obi.date).locale('ro').format('LLL'); // formatarea datei pentru limba română.
                
                // Array-ul activităților modificat
                obi.activitati = obi.activitati.map((elem) => {
                    let sablon = /^([aA-zZ])+\d/g;
                    let cssClass = elem[0].match(sablon);
                    let composed = '<span class="' + cssClass[0] + 'data-code="' + elem[0] + '">' + elem[1] + '</span>';
                    return composed;
                });
    
                // Dacă nu este indexată în Elasticsearch deja, indexează aici!
                // esClient.exists({
                //     index: RES_IDX_ES7,
                //     id: req.params.id
                // }).then(resFromIdx => {
                //     /* DACĂ RESURSA NU ESTE INDEXATĂ, introdu-o în indexul Elasticsearch */
                //     if(resFromIdx.body == false && resFromIdx.statusCode === 404){
                //         // verifică dacă există conținut
                //         var content2txt = '';
                //         if ('content' in obi) {
                //             content2txt = editorJs2TXT(obi.content.blocks); // transformă obiectul în text
                //         }
                //         // indexează documentul
                //         const data = {
                //             id:               obi._id,
                //             date:             obi.date,
                //             idContributor:    obi.idContributor,
                //             emailContrib:     obi.emailContrib,
                //             uuid:             obi.uuid,
                //             autori:           obi.autori,
                //             langRED:          obi.langRED,
                //             title:            obi.title,
                //             titleI18n:        obi.titleI18n,
                //             arieCurriculara:  obi.arieCurriculara,
                //             level:            obi.level,
                //             discipline:       obi.discipline,
                //             disciplinePropuse:obi.disciplinePropuse,
                //             competenteGen:    obi.competenteGen,
                //             rol:              obi.rol,
                //             abilitati:        obi.abilitati,
                //             materiale:        obi.materiale,
                //             grupuri:          obi.grupuri,
                //             domeniu:          obi.demersuri,
                //             spatii:           obi.spatii,
                //             invatarea:        obi.invatarea,
                //             description:      obi.description,
                //             dependinte:       obi.dependinte,
                //             coperta:          obi.coperta,
                //             content:          content2txt,
                //             bibliografie:     obi.bibliografie,
                //             contorAcces:      obi.contorAcces,
                //             generalPublic:    obi.generalPublic,
                //             contorDescarcare: obi.contorDescarcare,
                //             etichete:         obi.etichete,
                //             utilMie:          obi.utilMie,
                //             expertCheck:      obi.expertCheck,
                //             rating:           obi.rating
                //         };
    
                //         ES7Helper.searchIdxAndCreateDoc(schema, data, RES_IDX_ES7, RES_IDX_ALS);
                //     }
                //     return resFromIdx;
                // }).catch((err) => {
                //     console.error(err);
                //     logger.error(err);
                // });
                return obi;
            }
        }).then(resursa => {
            /* === ADMIN === */
            if(resursa !== null && req.session.passport.user.roles.admin){
    
                // Adaugă mecanismul de validare al resursei
                if (resursa.expertCheck) {
                    resursa.validate = `<input type="checkbox" id="valid" class="expertCheck" checked>`;
                } else {
                    resursa.validate = `<input type="checkbox" id="valid" class="expertCheck">`;
                }
                // Adaugă checkbox pentru zona publică
                if (resursa.generalPublic) {
                    resursa.genPub = `<input type="checkbox" id="public" class="generalPublic" checked>`;
                } else {
                    resursa.genPub = `<input type="checkbox" id="public" class="generalPublic">`;
                }
                // Setul de date va fi disponibil în `data-content` ca string JSON. Este trimis cu helperul `hbs.registerHelper('json', cb)` definit în app.js
                // Acest lucru este necesar pentru a reedita resursa în client.    
                res.render(`resursa-admin_${gensettings.template}`, {
                    template: `${gensettings.template}`,                    
                    title:     "Admin",
                    user:      req.user,
                    logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                    csrfToken: req.csrfToken(),
                    resursa,
                    scripts,
                    modules,
                    styles
                });
            } else if (confirmedRoles.includes('validator')) {
                // Adaugă doar checkbox de validare
                if (resursa.expertCheck) {
                    resursa.validate = `<input type="checkbox" id="valid" class="expertCheck" checked>`;
                } else {
                    resursa.validate = `<input type="checkbox" id="valid" class="expertCheck">`;
                }
                res.render(`resursa-validator_${gensettings.template}`, {
                    template: `${gensettings.template}`,                    
                    title:     "Validator",
                    user:      req.user,
                    logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                    csrfToken: req.csrfToken(),
                    resursa,
                    scripts,
                    modules,
                    styles
                });
            } else {
                res.redirect('/401');
            }
        }).catch((err) => {
            if (err) {
                console.log(err);
                logger.error(err);
                // next(); // fugi pe următorul middleware / rută
                res.redirect(`/administrator/reds`);
                next(err);
            }
        });
    };
    clbkAdmOneRes(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);
    });
});

/* === DESCĂRCARE ZIP === */
router.get('/reds/:id/zip', (req, res, next) => {
    archiveRED(req, res, next);
});

/* === /administrator/users === */
router.get('/users', (req, res, next) => {
    async function clbkAdmUsr (req, res) {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);
        // ACL
        let roles = ["admin", "validator"];
        
        // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
        let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
        
        /* === ADMIN === :: Dacă avem un admin, atunci oferă acces neîngrădit */
        if(req.session.passport.user.roles.admin){
            let modules = [
                // MAIN
                {module: `${gensettings.template}/js/main.mjs`},
                // DATATABLES
                {module: `${gensettings.template}/lib/npm/jquery.dataTables.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.select.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.buttons.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.print.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.html5.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.bootstrap4.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.responsive.min.js`},
                // LOCALE
                {module: `${gensettings.template}/js/users-visuals.mjs`}
            ];
    
            let styles = [
                // DATATABLES    
                {style: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.css`},
                {style: `${gensettings.template}/lib/npm/responsive.dataTables.min.css`},
                // TIMELINE
                {style: `${gensettings.template}/lib/timeline3/css/fonts/font.roboto-megrim.css`},
                {style: `${gensettings.template}/lib/timeline3/css/timeline.css`}
            ];

            let scripts = [       
                // MOMENT.JS
                {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`}
            ];
    
            res.render(`users-data-visuals_${gensettings.template}`, {
                template: `${gensettings.template}`,
                title:     "Users",
                user:      req.user,
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                csrfToken: req.csrfToken(),
                modules,
                styles,
                scripts,
                activeAdmLnk: true
            });
        } else {
            res.redirect('/401');
        }
    };
    clbkAdmUsr(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);
    })
});

/* === /administrator/users/:id === */
router.get('/users/:id', (req, res, next) => {
    async function clbkAdmRoot (req, res) {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);

        // ACL
        let roles = ["admin", "validator"];
        
        // Constituie un array cu rolurile care au fost setate pentru sesiunea în desfășurare. Acestea vin din coockie-ul clientului.
        let confirmedRoles = checkRole(req.session.passport.user.roles.rolInCRED, roles);
    
        /* === VERIFICAREA CREDENȚIALELOR === */
        // Dacă avem un admin, atunci oferă acces neîngrădit
        if(req.session.passport.user.roles.admin){
            let scripts = [       
                // MOMENT.JS
                {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`},
                {script: `${gensettings.template}/lib/timeline3/js/timeline.js`},
                // ZIP
                {script: `${gensettings.template}/lib/jszip.min.js`},
                // PDF
                {script: `${gensettings.template}/lib/pdfmake.min.js`},
                {script: `${gensettings.template}/lib/vfs_fonts.js`},
                // DATATABLES
                {script: `${gensettings.template}/lib/npm/jquery.dataTables.min.js`},
                {script: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.js`},
                {script: `${gensettings.template}/lib/npm/dataTables.select.min.js`},
                {script: `${gensettings.template}/lib/npm/dataTables.buttons.min.js`},
                {script: `${gensettings.template}/lib/npm/dataTables.responsive.min.js`},
                // TIMELINE 3
                {script: `${gensettings.template}/lib/timeline3/js/timeline.js`},
                {script: `${gensettings.template}/js/user.js`}
            ];
    
            let styles = [
                // DATATABLES    
                {style: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.css`},
                {style: `${gensettings.template}/lib/npm/responsive.dataTables.min.css`},
                // TIMELINE
                {style: `${gensettings.template}/lib/timeline3/css/fonts/font.roboto-megrim.css`},
                {style: `${gensettings.template}/lib/timeline3/css/timeline.css`}
            ];
            
            let csrfToken = req.csrfToken();
            console.log(`CSRF-ul trimis este: `, csrfToken);

            res.render(`user-admin_${gensettings.template}`, {
                template: `${gensettings.template}`,
                title:    "User",
                user:     req.user,
                logoimg:  `${gensettings.template}/${LOGO_IMG}`,
                csrfToken,
                scripts,
                styles,
                activeAdmLnk: true
            });
        // Dacă ai un validator, oferă aceleași drepturi precum administratorului, dar fără posibilitatea de a trimite în public
        } else if (confirmedRoles.includes('validator')) {
            let scripts = [       
                // MOMENT.JS
                {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`},
                {script: `${gensettings.template}/lib/timeline3/js/timeline.js`},
                // ZIP
                {script: `${gensettings.template}/lib/jszip.min.js`},
                // PDF
                {script: `${gensettings.template}/lib/pdfmake.min.js`},
                {script: `${gensettings.template}/lib/vfs_fonts.js`},
                // DATATABLES
                {script: `${gensettings.template}/lib/npm/jquery.dataTables.min.js`},
                {script: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.js`},
                {script: `${gensettings.template}/lib/npm/dataTables.select.min.js`},
                {script: `${gensettings.template}/lib/npm/dataTables.buttons.min.js`},
                {script: `${gensettings.template}/lib/npm/dataTables.responsive.min.js`},
                // TIMELINE 3
                {script: `${gensettings.template}/lib/timeline3/js/timeline.js`},
                {script: `${gensettings.template}/js/validator.js`}
            ];
            
            let styles = [
                // DATATABLES    
                {style: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.css`},
                {style: `${gensettings.template}/lib/npm/responsive.dataTables.min.css`},
                // TIMELINE
                {style: `${gensettings.template}/lib/timeline3/css/fonts/font.roboto-megrim.css`},
                {style: `${gensettings.template}/lib/timeline3/css/timeline.css`}
            ];
    
            res.render(`validator_${gensettings.template}`, {
                template: `${gensettings.template}`,
                title:     "Validare",
                user:      req.user,
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                csrfToken: req.csrfToken(),
                scripts,
                styles
            });
        } else {
            res.redirect('/401');
        }
    };
    clbkAdmRoot(req, res).catch((error) => {
        console.log(error);
        logger(error);
        next(error);
    });
});

/* === /administrator/compets === */
router.get('/compets', (req, res, next) => {
    async function clbkAdmCompets (req, res) {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);
        // DOAR ADMINISTRATORII VAD TOATE COMPETENȚELE SPECIFICE ODATĂ
        if(req.session.passport.user.roles.admin){
            let scripts = [       
                // MOMENT.JS
                {script: `moment/min/moment-with-locales.min.js`},
                // DATATABLES
                {script: `datatables.net/js/jquery.dataTables.min.js`},
                {script: `datatables.net-dt/js/dataTables.dataTables.min.js`},
                {script: `datatables.net-select-dt/js/select.dataTables.min.js`},
                {script: `datatables.net-buttons-dt/js/buttons.dataTables.min.js`},
                {script: `datatables.net-buttons/js/buttons.print.min.js`},
                {script: `datatables.net-responsive-dt/js/responsive.dataTables.min.js`},
                // ZIP
                {script: `${gensettings.template}/lib/jszip.min.js`},
                // PDF
                {script: `${gensettings.template}/lib/pdfmake.min.js`},
                {script: `${gensettings.template}/lib/vfs_fonts.js`}
            ];
    
            let modules = [
                // MAIN
                {module: `${gensettings.template}/js/main.mjs`},
                // LOCALE
                {module: `${gensettings.template}/js/comps-visuals.mjs`}
            ];
    
            let styles = [
                // DATATABLES    
                {style: `datatables.net-responsive-dt/css/responsive.dataTables.min.css`},
                {style: `datatables.net-dt/css/jquery.dataTables.min.css`},
                {style: `datatables.net-select-dt/css/select.dataTables.min.css`},
                {style: `datatables.net-buttons-dt/css/buttons.dataTables.min.css`}
            ];
    
            res.render(`comps-data-visuals_${gensettings.template}`, {
                template: `${gensettings.template}`,
                title:     "Competențe",
                user:      req.user,
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                csrfToken: req.csrfToken(),
                scripts,
                modules,
                styles,
                activeAdmLnk: true
            });
        } else {
            res.redirect('/401');
        }
    };
    clbkAdmCompets(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);
    });
});

/* === /administrator/compets/new === */
router.get('/compets/new', (req, res, next) => {
    async function clbkAdmCompetsID (req, res) {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);
        // DOAR ADMINISTRATORII VAD COMPETENȚA SPECIFICĂ
        if(req.session.passport.user.roles.admin){
            let modules = [
                // MAIN
                {module: `${gensettings.template}/js/main.mjs`},
                // DATATABLES
                {module: `${gensettings.template}/lib/npm/jquery.dataTables.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.select.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.buttons.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.print.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.html5.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.bootstrap4.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.responsive.min.js`},
                // LOCALE
                {module: `${gensettings.template}/js/comp-id.mjs`}
            ];
            let scripts = [       
                // MOMENT.JS
                {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`},
                {script: `${gensettings.template}/lib/timeline3/js/timeline.js`},
                // ZIP
                {script: `${gensettings.template}/lib/jszip.min.js`},
                // PDF
                {script: `${gensettings.template}/lib/pdfmake.min.js`},
                {script: `${gensettings.template}/lib/vfs_fonts.js`}
    
                // Scripturile caracteristice fiecărei rute vor fi injectate per rută
            ];
    
            res.render(`comp-id-admin_${gensettings.template}`, {         
                template: `${gensettings.template}`,           
                title:     "Comp",
                user:      req.user,
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                csrfToken: req.csrfToken(),
                scripts,
                modules,
                styles
            });
        } else {
            res.redirect('/401');
        }
    };
    clbkAdmCompetsID(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);
    });
});

/* === /administrator/compets/:id === */
router.get('/compets/:id', (req, res, next) => {
    async function clbkAdmCompetsID (req, res) {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);
        // DOAR ADMINISTRATORII VAD COMPETENȚA SPECIFICĂ
        if (req.session.passport.user.roles.admin) {
            let modules = [
                // MAIN
                {module: `${gensettings.template}/js/main.mjs`},
                // DATATABLES
                {module: `${gensettings.template}/lib/npm/jquery.dataTables.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.select.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.buttons.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.print.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.html5.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.bootstrap4.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.responsive.min.js`},
                // LOCALE
                {module: `${gensettings.template}/js/comp-id.mjs`}
            ];
    
            let scripts = [       
                // MOMENT.JS
                {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`},
                {script: `${gensettings.template}/lib/timeline3/js/timeline.js`},
                // ZIP
                {script: `${gensettings.template}/lib/jszip.min.js`},
                // PDF
                {script: `${gensettings.template}/lib/pdfmake.min.js`},
                {script: `${gensettings.template}/lib/vfs_fonts.js`}
    
                // Scripturile caracteristice fiecărei rute vor fi injectate per rută
            ];
            let styles = [
                // DATATABLES    
                {style: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.css`},
                {style: `${gensettings.template}/lib/npm/responsive.dataTables.min.css`},
                // TIMELINE
                {style: `${gensettings.template}/lib/timeline3/css/fonts/font.roboto-megrim.css`},
                {style: `${gensettings.template}/lib/timeline3/css/timeline.css`}
            ];        
    
            Competente.findById(req.params.id).populate({path: 'nrREDuri'}).then( (comp) => {
                if (comp.id) {
                    // console.log('Competenta trimisa are urmatoarea semnatura ', comp);
    
                    // transformă obiectul document de Mongoose într-un obiect normal.
                    const obi = Object.assign({}, comp._doc); 
    
                    // adaugă versiunea la care este înregistrarea și nr de RED-uri
                    obi['__v'] = comp.__v;
                    obi['nrREDuri'] = comp.nrREDuri;
    
                    // obiectul competenței specifice cu toate datele sale trebuie curățat.
                    obi.idRED = obi.idRED.map(obi => {
                        return Object.assign({}, obi._doc);
                    });
    
                    let localizat = moment(obi.date).locale('ro').format('LLL');
                    // resursa._doc.dataRo  = `${localizat}`; // formatarea datei pentru limba română.
                    obi.dataRo  = `${localizat}`; // formatarea datei pentru limba română.
    
                    return obi;
                }
            }).then((comp) => {
                /* === ADMIN === */
                if(req.session.passport.user.roles.admin){
                    res.render(`comp-id-admin_${gensettings.template}`, {
                        template: `${gensettings.template}`,                    
                        title:     "Comp",
                        user:      req.user,
                        logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                        csrfToken: req.csrfToken(),
                        comp,
                        scripts,
                        modules,
                        styles
                    });
                } else {
                    res.redirect('/401');
                }
            }).catch(err => {
                if (err) {
                    logger.error(err);
                    res.redirect(`/administrator/compets`);
                }
            });
        } else {
            res.redirect('/401');
        }
    };

    clbkAdmCompetsID(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);
    });
});

router.get('/import', (req, res, next) => {
    async function importpage (req, res) {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);
        // DOAR ADMINISTRATORII VAD TOATE COMPETENȚELE SPECIFICE ODATĂ
        if(req.session.passport.user.roles.admin){
            let scripts = [       
                // MOMENT.JS
                {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`}
            ];
    
            let modules = [
                // MAIN
                {module: `${gensettings.template}/js/main.mjs`}
            ];
    
            let styles = [

            ];
    
            res.render(`administrator-import_${gensettings.template}`, {
                template: `${gensettings.template}`,
                title:     "Import",
                user:      req.user,
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                csrfToken: req.csrfToken(),
                scripts,
                modules,
                styles,
                activeAdmLnk: true
            });
        } else {
            res.redirect('/401');
        }
    };
    importpage(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);
    });

})

router.get('/import/red', (req, res, next) => {
    async function importredpage (req, res) {
        // Setări în funcție de template
        let filterMgmt = {focus: 'general'};
        let gensettings = await Mgmtgeneral.findOne(filterMgmt);

        if(req.session.passport.user.roles.admin){
            let scripts = [       
                // MOMENT.JS
                {script: `${gensettings.template}/lib/npm/moment-with-locales.min.js`},
                // ZIP
                {script: `${gensettings.template}/lib/jszip.min.js`},
                // PDF
                {script: `${gensettings.template}/lib/pdfmake.min.js`},
                {script: `${gensettings.template}/lib/vfs_fonts.js`}
            ];
    
            let modules = [
                // MAIN
                {module: `${gensettings.template}/js/main.mjs`},
                // DATATABLES
                {module: `${gensettings.template}/lib/npm/jquery.dataTables.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.select.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.buttons.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.print.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.html5.min.js`},
                {module: `${gensettings.template}/lib/npm/buttons.bootstrap4.min.js`},
                {module: `${gensettings.template}/lib/npm/dataTables.responsive.min.js`},
                // LOCALE
                {module: `${gensettings.template}/js/import-red.mjs`}
            ];
    
            let styles = [
                // DATATABLES    
                {style: `${gensettings.template}/lib/npm/dataTables.bootstrap4.min.css`},
                {style: `${gensettings.template}/lib/npm/responsive.dataTables.min.css`}
            ];

            res.render(`administrator-import-red_${gensettings.template}`, {
                template: `${gensettings.template}`,
                title:     "Import RED",
                user:      req.user,
                logoimg:   `${gensettings.template}/${LOGO_IMG}`,
                csrfToken: req.csrfToken(),
                scripts,
                modules,
                styles,
                activeAdmLnk: true
            });
        } else {
            res.redirect('/401');
        }
    };
    importredpage(req, res, next).catch((error) => {
        console.log(error);
        logger(error);
        next(error);
    });
});


module.exports = router;
