var expect = require("chai").expect;
var asyncLoop = require('../async-loop.js');

describe("async-loop.error", function ()
{

    it("should not call endCallback error", function (done)
    {
        var array = [0, 2, 4, 6, 8, 10];

        asyncLoop(array, function (item, next)
        {
            next();
        }, function (err)
        {
            expect(err).to.be.a('null');
            done();
        });
    });

    it("should call endCallback error", function (done)
    {
        var array = [0, 2, 4, 6, 7, 8, 10];

        asyncLoop(array, function (item, next)
        {
            if (item % 2 != 0)
            {
                next(new Error('Item must be an even number: ' + item));
                return;
            }

            next();
        }, function (err)
        {
            expect(err).to.be.a('Error');
            expect(err.message).to.be.equals('Item must be an even number: 7');
            done();
        });
    });

    it("should stop loop on error", function (done)
    {
        var array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        asyncLoop(array, function (item, next)
        {
            expect(item).to.be.equals(0);
            next(new Error('Stop'));
        }, function (err)
        {
            expect(err).to.be.a('Error');
            expect(err.message).to.be.equals('Stop');
            setTimeout(function ()
            {
                done();
            }, 1);
        });
    });

    it("should not call endCallback", function (done)
    {
        var array = [0, 2, 4, 6, 8, 10];

        asyncLoop(array, function (item, next)
        {
            if (item <= 6)
                next();
        }, function (err)
        {
            expect(1).to.be.equals(0); // Will never append, always false!
        });

        setTimeout(function ()
        {
            done();
        }, 20);
    });

});