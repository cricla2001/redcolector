const assert = require('assert');
const Comp = require('../models/competenta-specifica');

describe('Ștergerea unei înregistrări din baza de date', () => {
    let comp; // este instanță de competență
    beforeEach((done) => {
        comp = new Comp({
            nume: 'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate',
        });
        comp.save().then(() => {
            done();
        });
    });
    it('Ștergere folosind metoda remove din model', (done) => {
        comp.deleteOne().then((r) => {
            // console.log(r); // trebuie să ai un `deletedCount: 1`
            Comp.findOne({nume: 'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate'});
        }).then((inregistrare) => {
            // console.log(inregistrare)
            assert(inregistrare === undefined);
            done();
        });
    });
    it('Ștergere folosind metoda remove din clasă', (done) => {
        Comp.deleteOne().then((r) => { // (node:20763) DeprecationWarning: collection.remove is deprecated. Use deleteOne, deleteMany, or bulkWrite instead.
            // console.log(r); // trebuie să ai un `deletedCount: 1`
            Comp.findOne({nume: 'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate'});
        }).then((inregistrare) => {
            // console.log(inregistrare)
            assert(inregistrare === undefined);
            done();
        });
    });
    it('Ștergere folosind metoda findOneAndRemove din clasă', (done) => {
        Comp.findOneAndRemove({nume: 'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate'}).then((r) => { // (node:20763) DeprecationWarning: collection.remove is deprecated. Use deleteOne, deleteMany, or bulkWrite instead.
            // console.log(r); // trebuie să ai un `deletedCount: 1`
            Comp.findOne({nume: 'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate'});
        }).then((inregistrare) => {
            // console.log(inregistrare)
            assert(inregistrare === undefined);
            done();
        });
    });
    it('Ștergere folosind metoda findByIdAndRemove din clasă', (done) => {
        Comp.findByIdAndRemove(comp._id).then((r) => {
            // console.log(r); // trebuie să ai un `deletedCount: 1`
            Comp.findOne({nume: 'Identificarea unor informaţii variate dintr-un mesaj rostit cu claritate'});
        }).then((inregistrare) => {
            // console.log(inregistrare)
            assert(inregistrare === undefined);
            done();
        });
    });
});