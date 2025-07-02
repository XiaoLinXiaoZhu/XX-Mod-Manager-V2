import { watch } from "vue";
import { Storage } from "../plugin/Storge";

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


A.set("123123");

storage.mergeData({
    id: "456",
});

storage.mergeData({
    id: "789",
}, true);
console.log(A.value, B.value,"A.value === B.value",A.value === B.value); // ❓结果？
console.log(A.getRef().value,B.getRef().value,"A.getRef().value === B.getRef().value",A.getRef().value === B.getRef().value); // ❓结果？

