var expect = require("chai").expect;
var asyncLoop = require('../async-loop.js');

describe("async-loop", function ()
{

    it("should loop completely trought arrays", function (done)
    {
        var array = ['aa', 'bb', 'cc', 'dd', 'ee'];
        var arrayCopy = [];

        asyncLoop(array, function (item, next)
        {
            arrayCopy.push(item);
            next();
        }, function ()
        {
            expect(arrayCopy).to.deep.equal(['aa', 'bb', 'cc', 'dd', 'ee']);
            done();
        });
    });

    it("should loop partially trought arrays (from)", function (done)
    {
        var array = ['aa', 'bb', 'cc', 'dd', 'ee'];
        var arrayCopy = [];

        asyncLoop(array, 2, function (item, next)
        {
            arrayCopy.push(item);
            next();
        }, function ()
        {
            expect(arrayCopy).to.deep.equal(['cc', 'dd', 'ee']);
            done();
        });
    });

    it("should loop partially trought arrays (from, to)", function (done)
    {
        var array = ['aa', 'bb', 'cc', 'dd', 'ee'];
        var arrayCopy = [];

        asyncLoop(array, 1, 2, function (item, next)
        {
            arrayCopy.push(item);
            next();
        }, function ()
        {
            expect(arrayCopy).to.deep.equal(['bb', 'cc']);
            done();
        });
    });

    it("should loop completely in reverse trought arrays", function (done)
    {
        var array = ['aa', 'bb', 'cc', 'dd', 'ee'];
        var arrayCopy = [];

        asyncLoop(array, -1, function (item, next)
        {
            arrayCopy.push(item);
            next();
        }, function ()
        {
            expect(arrayCopy).to.deep.equal(['ee', 'dd', 'cc', 'bb', 'aa']);
            done();
        });
    });

    it("should loop completely in reverse trought arrays (-from)", function (done)
    {
        var array = ['aa', 'bb', 'cc', 'dd', 'ee'];
        var arrayCopy = [];

        asyncLoop(array, -3, function (item, next)
        {
            arrayCopy.push(item);
            next();
        }, function ()
        {
            expect(arrayCopy).to.deep.equal(['cc', 'bb', 'aa']);
            done();
        });
    });

    it("should loop partially in reverse trought arrays (-from, to)", function (done)
    {
        var array = ['aa', 'bb', 'cc', 'dd', 'ee'];
        var arrayCopy = [];

        asyncLoop(array, -2, 2, function (item, next)
        {
            arrayCopy.push(item);
            next();
        }, function ()
        {
            expect(arrayCopy).to.deep.equal(['dd', 'cc']);
            done();
        });
    });

    it("should loop partially in reverse trought arrays (from, to)", function (done)
    {
        var array = ['aa', 'bb', 'cc', 'dd', 'ee'];
        var arrayCopy = [];
        asyncLoop(array, array.length - 2, 2, function (item, next)
        {
            arrayCopy.push(item);
            next();
        }, function ()
        {
            expect(arrayCopy).to.deep.equal(['dd', 'cc']);
            done();
        });
    });

    it("should loop partially trought arrays (-from, -to)", function (done)
    {
        var array = ['aa', 'bb', 'cc', 'dd', 'ee'];
        var arrayCopy = [];
        asyncLoop(array, -2, -1, function (item, next)
        {
            arrayCopy.push(item);
            next();
        }, function ()
        {
            expect(arrayCopy).to.deep.equal(['dd', 'ee']);
            done();
        });
    });

    it("should loop partially trought arrays (from, -to)", function (done)
    {
        var array = ['aa', 'bb', 'cc', 'dd', 'ee'];
        var arrayCopy = [];
        asyncLoop(array, 0, -2, function (item, next)
        {
            arrayCopy.push(item);
            next();
        }, function ()
        {
            expect(arrayCopy).to.deep.equal(['aa', 'bb', 'cc', 'dd']);
            done();
        });
    });

    it("should loop without endCallback", function (done)
    {
        var i = 0;
        var array = ['aa', 'bb', 'cc', 'dd', 'ee'];
        var arrayCopy = [];
        asyncLoop(array, function (item, next)
        {
            arrayCopy.push(item);
            i++;
            if (i >= 5)
            {
                expect(i).to.equal(5);
                expect(arrayCopy).to.deep.equal(['aa', 'bb', 'cc', 'dd', 'ee']);
                setTimeout(function ()
                {
                    done();
                }, 1);
            }
            next();
        });
    });

    it("should loop without endCallback (from)", function (done)
    {
        var i = 0;
        var array = ['aa', 'bb', 'cc', 'dd', 'ee'];
        var arrayCopy = [];
        asyncLoop(array, 2, function (item, next)
        {
            arrayCopy.push(item);
            i++;
            if (i >= 3)
            {
                expect(i).to.equal(3);
                expect(arrayCopy).to.deep.equal(['cc', 'dd', 'ee']);
                setTimeout(function ()
                {
                    done();
                }, 1);
            }
            next();
        });
    });

    it("should loop without endCallback (from, to)", function (done)
    {
        var i = 0;
        var array = ['aa', 'bb', 'cc', 'dd', 'ee'];
        var arrayCopy = [];
        asyncLoop(array, 1, 3, function (item, next)
        {
            arrayCopy.push(item);
            i++;
            if (i >= 3)
            {
                expect(i).to.equal(3);
                expect(arrayCopy).to.deep.equal(['bb', 'cc', 'dd']);
                setTimeout(function ()
                {
                    done();
                }, 1);
            }
            next();
        });
    });

});