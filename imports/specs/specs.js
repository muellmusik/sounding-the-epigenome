const specs = {

    width: function(val, outmin, outmax){
        const inmin = 0;
        const inmax = 200;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    sumReadsN1: function(val, outmin, outmax){
        const inmin = 9;
        const inmax = 699;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    proportion1: function(val, outmin, outmax){
        const inmin = 0.0078740157480315;
        const inmax = 0.96875;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    proportion2: function(val, outmin, outmax){
        const inmin = 0.024390243902439;
        const inmax = 0.96;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    cytosinesCount: function(val, outmin, outmax){
        const inmin = 2;
        const inmax = 14;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    direction: function(val, outmin, outmax){
        const inmin = -1;
        const inmax = 1;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },
};

export default specs;
