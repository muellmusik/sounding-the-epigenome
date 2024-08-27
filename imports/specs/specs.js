const specs = {

    width: function(val, outmin, outmax){
        const inmin = 0;
        const inmax = 500;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    proportion1: function(val, outmin, outmax){
        const inmin = 0;
        const inmax = 1;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    proportion2: function(val, outmin, outmax){
        const inmin = 0;
        const inmax = 1;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    direction: function(val, outmin, outmax){
        const inmin = -1;
        const inmax = 1;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },

    pValue: function(val, outmin, outmax){
        const inmin = 0;
        const inmax = 0.1;
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },
};

export default specs;
