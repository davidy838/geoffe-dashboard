import { Box, useTheme } from "@mui/material";
import BCHeatmap from "../../components/BCHeatmap";
import Header from "../../components/Header";
import { tokens } from "../../theme";

const Geography = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box m="20px">
      <Header title="BC CHSA Heatmap" subtitle="British Columbia Community Health Service Areas - Unit Cost Heatmap" />

      <Box
        height="75vh"
        border={`1px solid ${colors.grey[100]}`}
        borderRadius="4px"
      >
        <BCHeatmap />
      </Box>
    </Box>
  );
};

export default Geography;
