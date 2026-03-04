import {updateUpdater} from "./updateUpdater";

const beforeVite = async () => {
  await updateUpdater();
};
export default beforeVite;
