const nextId = (() => {
  let currentId = 0;

  return () => {
    currentId += 1;
    return currentId;
  };
})();

module.exports = nextId;
