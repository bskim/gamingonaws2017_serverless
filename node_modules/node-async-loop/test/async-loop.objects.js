var expect = require("chai").expect;
var asyncLoop = require('../async-loop.js');

describe("async-loop.objects", function ()
{

    it("should loop trought objects", function (done)
    {
        var obj = {
            'aa': 'AA',
            'bb': 'BB',
            'cc': 'CC',
            'dd': 'DD',
            'ee': 'EE'
        };
        var count = 0;

        asyncLoop(obj, function (item, next)
        {
            expect(item.key).to.be.a("string");
            expect(item.value).to.be.a("string");
            expect(item.value).to.be.equals(item.key.toUpperCase());
            count++;
            next();
        }, function ()
        {
            expect(count).to.be.equals(5);
            done();
        });
    });

});