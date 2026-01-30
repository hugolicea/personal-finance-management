export const sortCategories = <T extends { name: string }>(categories: T[]) => {
    return categories.slice().sort((a, b) => a.name.localeCompare(b.name));
};

export default sortCategories;
