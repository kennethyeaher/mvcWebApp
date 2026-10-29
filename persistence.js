// The storage adapter handles browser failures without changing Model rules.
const restaurantStorage = {
  key: "restaurant-finder.saved.v1",

  /** Read versioned data without trusting its shape or browser availability.
   * @param {Storage} storage Browser storage or a test adapter.
   * @returns {object} Saved IDs, availability, and an optional recovery message.
   */
  load: function (storage) {
    try {
      const raw = storage.getItem(this.key);
      if (raw === null) return { ids: [], available: true, message: "" };
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1 || !Array.isArray(parsed.ids) ||
          parsed.ids.length > 100 || !parsed.ids.every((id) => typeof id === "string")) {
        return { ids: [], available: true, message: "Saved places could not be read. You can start a new list." };
      }
      return { ids: parsed.ids, available: true, message: "" };
    } catch {
      return { ids: [], available: false, message: "Saved places are available for this visit. Browser storage could not be read." };
    }
  },

  /** Write saved IDs or remove the entry when the selection is empty.
   * @param {Storage} storage Browser storage or a test adapter.
   * @param {string[]} ids Known IDs supplied by the Model.
   * @returns {boolean} False when storage is blocked or full.
   */
  save: function (storage, ids) {
    try {
      if (ids.length === 0) storage.removeItem(this.key);
      else storage.setItem(this.key, JSON.stringify({ version: 1, ids }));
      return true;
    } catch {
      return false;
    }
  }
};
