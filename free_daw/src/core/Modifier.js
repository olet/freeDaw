class Modifier {
    constructor(type, params = {}) {
        this.type = type;
        this.params = params;
    }

    apply(pattern, time, state) {
        // 由具体的modifier实现类重写
        throw new Error('Method not implemented');
    }
}

export default Modifier; 