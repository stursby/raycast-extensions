import { ActionPanel, List, Action, showToast, Toast, Icon, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import { LangCode, UsageExample } from "./domain";
import { getUsageExamples } from "./reversoApi";
import { buildDetails, clearTag, codeToLanguageDict, reversoBrowserQuery, toMdBold } from "./utils";

let count = 0;

export default function Command() {
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  const [examples, setExamples] = useState<UsageExample[]>([]);
  const [isShowingDetail, setIsShowingDetail] = useState(false);

  useEffect(() => {
    if (text === "") {
      return;
    }

    count++;
    const localCount = count;

    setIsLoading(true);
    setExamples([]);

    const preferences = getPreferenceValues<{
      langFrom: LangCode;
      langTo: LangCode;
    }>();

    showToast(Toast.Style.Animated, `[${preferences.langFrom} -> ${preferences.langTo}]`, "Loading...");

    getUsageExamples(text, preferences.langFrom, preferences.langTo)
      .then((examples) => {
        if (localCount !== count) {
          // If current request is not actual, ignore it.
          return;
        }

        setExamples(examples);
      })
      .catch((error) => {
        showToast(Toast.Style.Failure, "Could not translate", error);
      })
      .then(() => {
        setIsLoading(false);
        showToast(Toast.Style.Success, `[${preferences.langFrom} -> ${preferences.langTo}]`, "Finished");
      });
  }, [text]);

  return (
    <List
      searchBarPlaceholder="Enter text to see usage examples"
      onSearchTextChange={setText}
      isLoading={isLoading}
      isShowingDetail={isShowingDetail}
      throttle
    >
      {examples.map((e, index) => (
        <List.Item
          key={index}
          title={e.tText}
          accessoryTitle={clearTag(e.tExample)}
          detail={<List.Item.Detail markdown={buildDetails(e)} />}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <Action
                  title="Show full example and translation"
                  icon={Icon.Text}
                  onAction={() => setIsShowingDetail(!isShowingDetail)}
                />
                <Action.CopyToClipboard title="Copy" content={clearTag(e.tExample)} />
                <Action.OpenInBrowser
                  title="Open in Reverso Context"
                  shortcut={{ modifiers: ["opt"], key: "enter" }}
                  url={`${reversoBrowserQuery}/${codeToLanguageDict[e.sLang]}-${codeToLanguageDict[e.tLang]}/${
                    e.sText
                  }`}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
