const specs = {

    sumReadsM1: function(val, outmin, outmax){
        const inmin = 0;
        const inmax = 556;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    sumReadsN1: function(val, outmin, outmax){
        const inmin = 9;
        const inmax = 788;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    proportion1: function(val, outmin, outmax){
        const inmin = 0.0128205128205128;
        const inmax = 0.962025316455696;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    sumReadsM2: function(val, outmin, outmax){
        const inmin = 0;
        const inmax = 297;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    sumReadsN2: function(val, outmin, outmax){
        const inmin = 13;
        const inmax = 521;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    proportion2: function(val, outmin, outmax){
        const inmin = 0.0625;
        const inmax = 0.976744186046512;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    cytosinesCount: function(val, outmin, outmax){
        const inmin = 2;
        const inmax = 46;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    pValue: function(val, outmin, outmax){
        const inmin = 7.71860487726271e-27;
        const inmax = 0.0197041739809947;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },
};

export default specs;
