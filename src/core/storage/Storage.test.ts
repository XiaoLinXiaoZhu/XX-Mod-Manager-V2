import { watch } from "vue";
import { Storage } from "./Storage";

const storage = new Storage();
storage.storageName = "test";
const A = storage.useStorage("id", "123");
const B = storage.useStorage("id", "123");

watch(A.getRef(), (newValue) => {
    console.log("A.value changed", newValue);
});
watch(B.getRef(), (newValue) => {
    console.log("B.value changed", newValue);
});


A.value = "123"; // 修改 A 的值

storage.mergeData({
    id: "456",
});

storage.mergeData({
    id: "789",
}, true);
console.log(A.value, B.value,"A.value === B.value",A.value === B.value); // ❓结果？
console.log(A.getRef().value,B.getRef().value,"A.getRef().value === B.getRef().value",A.getRef().value === B.getRef().value); // ❓结果？

