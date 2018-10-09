import React from "react";
import {
  Button,
  StyleSheet,
  View,
} from "react-native";
import { createStackNavigator, NavigationScreenProp } from "react-navigation";
import B2CLoginExample from "./B2CLoginExample";
import CommonLoginExample from "./CommonLoginExample";

interface IProps {
  navigation: NavigationScreenProp<any>;
}
class HomeScreen extends React.Component<IProps> {
  public render() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={styles.buttonContainerStyle}>
          <Button
            title="Common Example"
            onPress={() => this.props.navigation.navigate("CommonLoginExample")}
          />
        </View>
        <View style={styles.buttonContainerStyle}>
          <Button
            title="B2C Example"
            onPress={() => this.props.navigation.navigate("B2CLoginExample")}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainerStyle: {
    margin: 10,
  },
});

export default createStackNavigator({
  HomeScreen,
  B2CLoginExample: {
    screen: B2CLoginExample,
    navigationOptions: () => ({
    headerBackTitle: null,
      title: "B2C Login Example",
    }),
  },
  CommonLoginExample: {
    screen: CommonLoginExample,
    navigationOptions: () => ({
      title: "Common Login Example",
      headerBackTitle: null,
    }),
  },
});
